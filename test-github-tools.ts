import { listGists, getGist, createGist, updateGist, deleteGist } from './src/mastra/tools/github/gists';
import { getCommit, createCommit, getTree, createTree, getBlob, createBlob, getRef, createRef, updateRef, deleteRef } from './src/mastra/tools/github/gitData';

async function testTool(tool, context) {
  try {
    const result = await tool.execute({ context, tracingContext: null });
    console.log(`Tool ${tool.id} executed successfully:`, result.status);
    return true;
  } catch (error) {
    console.error(`Tool ${tool.id} crashed:`, error);
    return false;
  }
}

async function runTests() {
  console.log('Testing GitHub Gists tools...');
  const gistsTests = await Promise.all([
    testTool(listGists, { username: 'octocat' }),
    testTool(getGist, { gist_id: 'test-id' }),
    testTool(createGist, { files: { 'test.txt': { content: 'test' } }, description: 'test', public: true }),
    testTool(updateGist, { gist_id: 'test-id', description: 'updated' }),
    testTool(deleteGist, { gist_id: 'test-id' })
  ]);
  if (gistsTests.every(t => t)) {
    console.log('All Gists tools passed');
  } else {
    console.log('Some Gists tools failed');
    process.exit(1);
  }

  console.log('Testing Git Data tools...');
  const gitDataTests = await Promise.all([
    testTool(getCommit, { owner: 'octocat', repo: 'Hello-World', commit_sha: 'test-sha' }),
    testTool(createCommit, { owner: 'octocat', repo: 'Hello-World', message: 'test', tree: 'test-tree-sha' }),
    testTool(getTree, { owner: 'octocat', repo: 'Hello-World', tree_sha: 'test-sha' }),
    testTool(createTree, { owner: 'octocat', repo: 'Hello-World', tree: [{ path: 'test', mode: '100644', type: 'blob', content: 'test' }] }),
    testTool(getBlob, { owner: 'octocat', repo: 'Hello-World', file_sha: 'test-sha' }),
    testTool(createBlob, { owner: 'octocat', repo: 'Hello-World', content: 'test content', encoding: 'utf-8' }),
    testTool(getRef, { owner: 'octocat', repo: 'Hello-World', ref: 'main' }),
    testTool(createRef, { owner: 'octocat', repo: 'Hello-World', ref: 'refs/heads/test', sha: 'test-sha' }),
    testTool(updateRef, { owner: 'octocat', repo: 'Hello-World', ref: 'main', sha: 'test-sha' }),
    testTool(deleteRef, { owner: 'octocat', repo: 'Hello-World', ref: 'test-ref' })
  ]);
  if (gitDataTests.every(t => t)) {
    console.log('All Git Data tools passed');
  } else {
    console.log('Some Git Data tools failed');
    process.exit(1);
  }

  console.log('All tests passed - no crashes');
}

runTests().catch(console.error);