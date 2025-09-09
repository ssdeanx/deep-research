import { Octokit } from '@octokit/rest';
import { PinoLogger } from "@mastra/loggers";

const logger = new PinoLogger({ level: 'info' });

export const octokit = new Octokit({ auth: process.env.GITHUB_API_KEY });
export async function getRepositoryInfo(owner: string, repo: string) {
    try {
        const response = await octokit.repos.get({
            owner,
            repo
        });
        return response.data;
    } catch (error) {
        logger.error('Error fetching repository info', { error: error instanceof Error ? error.message : String(error) });
        throw error;
    }
}
