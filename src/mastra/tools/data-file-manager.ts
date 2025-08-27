import * as fs from 'fs/promises';
import * as path from 'node:path';
import { z } from 'zod';
import { createTool } from '@mastra/core/tools';
import { PinoLogger } from '@mastra/loggers';

const logger = new PinoLogger({ name: 'DataFileManager', level: 'info' });

const DATA_DIR = path.join(process.cwd(), 'data');

/**
 * Ensures the given filePath is within the DATA_DIR.
 * @param filePath The path to validate.
 * @returns The absolute, validated path.
 * @throws Error if the path is outside the allowed data directory.
 */
function validateDataPath(filePath: string): string {
    const absolutePath = path.resolve(DATA_DIR, filePath);
    if (!absolutePath.startsWith(DATA_DIR)) {
        throw new Error(`Access denied: File path "${filePath}" is outside the allowed data directory.`);
    }
    return absolutePath;
}

export const readDataFileTool = createTool({
    id: "read-data-file",
    description: "Reads content from a file within the data directory.",
    inputSchema: z.object({
        fileName: z.string().describe("The name of the file (relative to the data/ directory)."),
    }),
    outputSchema: z.string().describe("The content of the file as a string."),
    execute: async ({ context }) => {
        const { fileName } = context;
        const fullPath = validateDataPath(fileName);
        // Defensive: Ensure fullPath is within DATA_DIR before reading
        if (!fullPath.startsWith(DATA_DIR)) {
            throw new Error(`Access denied: File path "${fileName}" is outside the allowed data directory.`);
        }
        const content = await fs.readFile(fullPath, 'utf-8');
        logger.info(`Read file: ${fileName}`);
        return content;
    },
});

export const writeDataFileTool = createTool({
    id: "write-data-file",
    description: "Writes content to a file within the data directory. If the file does not exist, it will be created. If it exists, its content will be overwritten.",
    inputSchema: z.object({
        fileName: z.string().describe("The name of the file (relative to the data/ directory)."),
        content: z.string().describe("The content to write to the file."),
    }),
    outputSchema: z.string().describe("A confirmation string indicating success."),
    execute: async ({ context }) => {
        const { fileName, content } = context;
        const fullPath = validateDataPath(fileName);
        const dirPath = path.dirname(fullPath);
        // Defensive: Ensure dirPath is within DATA_DIR before creating directory
        if (!dirPath.startsWith(DATA_DIR)) {
            throw new Error(`Access denied: Directory path "${dirPath}" is outside the allowed data directory.`);
        }
        await fs.mkdir(dirPath, { recursive: true });
        await fs.writeFile(fullPath, content, 'utf-8');
        logger.info(`Written to file: ${fileName}`);
        return `File ${fileName} written successfully.`;
    },
});

export const deleteDataFileTool = createTool({
    id: "delete-data-file",
    description: "Deletes a file within the data directory.",
    inputSchema: z.object({
        fileName: z.string().describe("The name of the file (relative to the data/ directory)."),
    }),
    outputSchema: z.string().describe("A confirmation string indicating success."),
    execute: async ({ context }) => {
        const { fileName } = context;
        const fullPath = validateDataPath(fileName);
        // Defensive: Ensure fullPath is within DATA_DIR before deleting
        if (!fullPath.startsWith(DATA_DIR)) {
            throw new Error(`Access denied: File path "${fileName}" is outside the allowed data directory.`);
        }
        await fs.unlink(fullPath);
        logger.info(`Deleted file: ${fileName}`);
        return `File ${fileName} deleted successfully.`
    },
});

export const listDataDirTool = createTool({
    id: "list-data-directory",
    description: "Lists files and directories within a specified path in the data directory.",
    inputSchema: z.object({
        dirPath: z.string().optional().describe("The path within the data directory to list (e.g., '', 'subfolder/')."),
    }),
    outputSchema: z.array(z.string()).describe("An array of file and directory names."),
    execute: async ({ context }) => {
        const { dirPath = '' } = context;
        const fullPath = validateDataPath(dirPath);
        // Defensive: Ensure fullPath is within DATA_DIR before reading directory
        if (!fullPath.startsWith(DATA_DIR)) {
            throw new Error(`Access denied: Directory path "${dirPath}" is outside the allowed data directory.`);
        }
        const contents = await fs.readdir(fullPath);
        logger.info(`Listed directory: ${dirPath}`);
        return contents;
    },
});