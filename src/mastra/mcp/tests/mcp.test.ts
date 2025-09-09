import { test } from 'node:test';
import assert from 'node:assert';
import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { setTimeout } from 'node:timers/promises';

const SERVER_START_TIMEOUT = 5000;
const SERVER_PATH = 'src/mastra/mcp/server.ts';

test('MCP Server Tests', async (testContext) => {
  const serverProcess = spawn('tsx', [SERVER_PATH], {
    stdio: ['pipe', 'pipe', 'pipe'],
  });

  let serverReady = false;
  let serverError = '';

  const readyPromise = new Promise<void>((resolve, reject) => {
    serverProcess.stderr.on('data', (data) => {
      const message = data.toString();
      console.error(`Server stderr: ${message}`);
      if (message.includes('Mastra Deep Research MCP Server started successfully')) {
        serverReady = true;
        resolve();
      } else if (!serverReady) {
        serverError += message;
      }
    });

    serverProcess.on('exit', (code) => {
      if (!serverReady) {
        reject(new Error(`Server process exited with code ${code}, stderr: ${serverError}`));
      }
    });
  });

  await testContext.test('should start the MCP server successfully', async () => {
    await Promise.race([
      readyPromise,
      setTimeout(SERVER_START_TIMEOUT, undefined, { ref: false }).then(() => {
        if (!serverReady) {
          throw new Error('Server failed to start within the timeout period.');
        }
      })
    ]);
    assert.ok(serverReady, 'MCP server should be ready');
  });

  const sendMessage = (message: any) => {
    const serializedMessage = JSON.stringify(message);
    serverProcess.stdin.write(`${serializedMessage}\n`);
  };

  const messageQueue: any[] = [];
  const messageResolvers: Array<(message: any) => void> = [];
  let stdoutBuffer = '';

  serverProcess.stdout.on('data', (data) => {
    stdoutBuffer += data.toString();
    let newlineIndex;
    while ((newlineIndex = stdoutBuffer.indexOf('\n')) !== -1) {
      const line = stdoutBuffer.slice(0, newlineIndex);
      stdoutBuffer = stdoutBuffer.slice(newlineIndex + 1);
      if (line.trim() === '') {
        continue;
      }
      try {
        const message = JSON.parse(line);
        if (messageResolvers.length > 0) {
          const resolve = messageResolvers.shift();
          if (resolve) {
            resolve(message);
          }
        } else {
          messageQueue.push(message);
        }
      } catch {
        console.log(`Ignoring non-JSON line from stdout: ${line}`);
      }
    }
  });

  const readMessage = () => {
    return new Promise<any>((resolve) => {
      if (messageQueue.length > 0) {
        const message = messageQueue.shift();
        resolve(message);
      } else {
        messageResolvers.push(resolve);
      }
    });
  };

  await testContext.test('should list all available tools', async () => {
    const requestId = randomUUID();
    sendMessage({
      jsonrpc: '2.0',
      id: requestId,
      method: 'listTools',
      params: {},
    });

    const response = await readMessage();
    assert.strictEqual(response.id, requestId);
    assert.ok(response.result.tools.length > 0, 'Should return at least one tool');
    const tool = response.result.tools.find((t: { name: string }) => t.name === 'weatherTool');
    assert.ok(tool, 'weatherTool should be in the list');
    assert.strictEqual((tool).description, 'Get the weather for a location');
  });

  await testContext.test('should call a tool with valid arguments', async () => {
    const requestId = randomUUID();
    sendMessage({
      jsonrpc: '2.0',
      id: requestId,
      method: 'callTool',
      params: {
        name: 'weatherTool',
        arguments: { location: 'New York' },
      },
    });

    const response = await readMessage();
    assert.strictEqual(response.id, requestId);
    assert.ok(!response.result.isError, 'Tool call should not result in an error');
    const content = JSON.parse(response.result.content[0].text);
    assert.ok(content.temperature, 'Response should contain temperature');
  });

  await testContext.test('should return an error for a non-existent tool', async () => {
    const requestId = randomUUID();
    sendMessage({
      jsonrpc: '2.0',
      id: requestId,
      method: 'callTool',
      params: {
        name: 'nonExistentTool',
        arguments: {},
      },
    });

    const response = await readMessage();
    assert.strictEqual(response.id, requestId);
    assert.ok(response.result.isError, 'Should return an error for a non-existent tool');
    assert.ok(response.result.content[0].text.includes('Unknown tool: nonExistentTool'));
  });

  await testContext.test('should return an error for invalid arguments', async () => {
    const requestId = randomUUID();
    sendMessage({
      jsonrpc: '2.0',
      id: requestId,
      method: 'callTool',
      params: {
        name: 'weatherTool',
        arguments: { city: 'New York' }, // Invalid argument name
      },
    });

    const response = await readMessage();
    assert.strictEqual(response.id, requestId);
    assert.ok(response.result.isError, 'Should return an error for invalid arguments');
    assert.ok(response.result.content[0].text.includes('Invalid arguments'));
  });

  testContext.after(() => {
    serverProcess.kill();
  });
});
