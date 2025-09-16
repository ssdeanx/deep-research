import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { PinoLogger } from "@mastra/loggers";
import { AISpanType } from '@mastra/core/ai-tracing';
import * as cheerio from "cheerio";
import { Request, CheerioCrawler } from "crawlee";
import { marked } from "marked";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import { JSDOM } from "jsdom";

const logger = new PinoLogger({ name: 'WebScraperTool', level: 'info' });

// Enhanced HTML processing with JSDOM
const DANGEROUS_TAGS = new Set([
  'script', 'style', 'iframe', 'embed', 'object', 'noscript', 'meta', 'link', 'form', 'input', 'button', 'select', 'textarea', 'frame', 'frameset'
]);

const DANGEROUS_ATTRS = new Set([
  'onload', 'onerror', 'onclick', 'onmouseover', 'onmouseout', 'onkeydown', 'onkeyup', 'onkeypress', 'onfocus', 'onblur', 'formaction'
]);

function sanitizeHtml(html: string): string {
  try {
    // Ensure input is a string and explicitly treat as HTML to avoid ambiguous parsing
    const safeHtml = String(html);
    const jsdom = new JSDOM(safeHtml, { contentType: 'text/html', includeNodeLocations: false });
    const { document } = jsdom.window;

    // Remove dangerous elements
    DANGEROUS_TAGS.forEach(tagName => {
      const elements = document.querySelectorAll(tagName);
      elements.forEach(element => element.remove());
    });

    // Remove event handler attributes
    const allElements = document.querySelectorAll('*');
    allElements.forEach(element => {
      Array.from(element.attributes).forEach(attr => {
        if (attr.name.startsWith('on') || DANGEROUS_ATTRS.has(attr.name.toLowerCase())) {
          element.removeAttribute(attr.name);
        }
      });
    });

    return document.body.innerHTML;
  } catch (error) {
    logger.warn('JSDOM sanitization failed, falling back to cheerio', { error });
    // Pre-sanitize the raw HTML to avoid passing dangerous content directly into cheerio.
    // Remove dangerous elements and inline event handlers, and neutralize javascript: hrefs.
    const preSanitizedHtml = String(html)
      // Remove dangerous elements with their content: script, style, iframe, embed, object, noscript, meta, link, form, input, button, select, textarea, frame, frameset
      .replace(/<\s*(script|style|iframe|embed|object|noscript|meta|link|form|input|button|select|textarea|frame|frameset)\b[^>]*>[\s\S]*?<\/\s*\1\s*>/gi, '')
      // Remove self-closing dangerous tags (meta, link, input), but keep img tags intact
      .replace(/<\s*(meta|link|input|br|hr)[^>]*\/?>/gi, '')
      // Remove inline event handler attributes like onclick="..." and onmouseover='...'
      .replace(/ on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, ' ')
      // Neutralize javascript: URIs in href attributes
      .replace(/href\s*=\s*("|\\')\s*javascript:[^"\\']*\1/gi, 'href="#"');

    const $ = cheerio.load(preSanitizedHtml, { xmlMode: false });
    DANGEROUS_TAGS.forEach(tag => $(tag).remove());
    $('*').each((_i, element) => {
      const el = $(element);
      const attrs = el.attr();
      if (attrs) {
        Object.keys(attrs).forEach(attr => {
          if (DANGEROUS_ATTRS.has(attr.toLowerCase()) || attr.toLowerCase().startsWith('on')) {
            el.removeAttr(attr);
          }
        });
      }
    });
    return $.html();
  }
}

function extractTextContent(html: string): string {
  try {
    const dom = new JSDOM(html, { includeNodeLocations: false });
    return dom.window.document.body.textContent?.trim() ?? '';
  } catch (error) {
    logger.warn('JSDOM text extraction failed, falling back to cheerio', { error });
    const $ = cheerio.load(html);
    return $.text().trim();
  }
}

function htmlToMarkdown(html: string): string {
  try {
    const sanitizedHtml = sanitizeHtml(html);
    const dom = new JSDOM(sanitizedHtml, { includeNodeLocations: true });
    const {document} = dom.window;

    const convertNode = (node: Node): string => {
      if (node.nodeType === dom.window.Node.TEXT_NODE) {
        return node.textContent?.trim() ?? '';
      }

      if (node.nodeType === dom.window.Node.ELEMENT_NODE) {
        const element = node as Element;
        const tagName = element.tagName.toLowerCase();
        switch (tagName) {
          case 'h1': return `# ${getTextContent(element)}\n\n`;
          case 'h2': return `## ${getTextContent(element)}\n\n`;
          case 'h3': return `### ${getTextContent(element)}\n\n`;
          case 'h4': return `#### ${getTextContent(element)}\n\n`;
          case 'h5': return `##### ${getTextContent(element)}\n\n`;
          case 'h6': return `###### ${getTextContent(element)}\n\n`;
          case 'p': return `${getTextContent(element)}\n\n`;
          case 'br': return '\n';
          case 'strong':
          case 'b': return `**${getTextContent(element)}**`;
          case 'em':
          case 'i': return `*${getTextContent(element)}*`;
          case 'code': return `\`${getTextContent(element)}\``;
          case 'pre': return `\`\`\`\n${getTextContent(element).trim()}\n\`\`\`\n\n`;
          case 'a': {
            const href = element.getAttribute('href');
            const text = getTextContent(element);
            return (href !== null) ? `[${text}](${href})` : text;
          }
          case 'ul': return `${convertChildren(element)}\n`;
          case 'ol': return `${convertChildren(element)}\n`;
          case 'li': return `- ${getTextContent(element)}\n`;
          case 'blockquote': return `> ${getTextContent(element)}\n\n`;
          case 'hr': return '---\n\n';
          case 'img': {
            // Normalize src/alt and skip images without a usable src
            const srcAttr = element.getAttribute('src');
            const altAttr = element.getAttribute('alt') ?? '';
            const trimmedSrc = (srcAttr ?? '').trim();
            if (trimmedSrc === '') {
              return '';
            }
            const alt = altAttr.trim();
            return `![${alt}](${trimmedSrc})`;
          }
          case 'table': return convertTable(element);
          default: return convertChildren(element);
        }
      }
      return '';
    };

    const convertChildren = (element: Element): string => {
      let result = '';
      element.childNodes.forEach(child => {
        result += convertNode(child);
      });
      return result;
    };

    const getTextContent = (element: Element): string => {
      let result = '';
      element.childNodes.forEach(child => {
        result += convertNode(child);
      });
      return result;
    };

    const convertTable = (table: Element): string => {
      const rows = Array.from(table.querySelectorAll('tr'));
      if (rows.length === 0) {
        return '';
      }

      let markdown = '';
      rows.forEach((row, index) => {
        const cells = Array.from(row.querySelectorAll('td, th'));
        const cellTexts = cells.map(cell => getTextContent(cell));
        markdown += '| ' + cellTexts.join(' | ') + ' |\n';

        if (index === 0) {
          markdown += '| ' + cellTexts.map(() => '---').join(' | ') + ' |\n';
        }
      });
      return markdown + '\n';
    };

    return convertNode(document.body).trim();
  } catch (error) {
    logger.warn('JSDOM conversion failed, using marked fallback', { error });
    return extractTextContent(html);
  }
}

function sanitizeMarkdown(markdown: string): string {
  try {
    // markdown is guaranteed to be a string by zod schema, so null/undefined checks are redundant.
    // String(markdown) handles potential non-string inputs gracefully.
    // Escape angle brackets to reduce risk of injecting raw HTML when markdown is rendered in HTML contexts.
    // Preserve other markdown syntax but ensure raw HTML tags are neutralized.
    return String(markdown).replace(/</g, '&lt;').replace(/>/g, '&gt;');
  } catch {
    return '';
  }
}

export const HtmlProcessor = {
  DANGEROUS_TAGS,
  DANGEROUS_ATTRS,
  sanitizeHtml,
  extractTextContent,
  htmlToMarkdown,
  sanitizeMarkdown,
};

// Enhanced error handling utilities
class ScrapingError extends Error {
  public readonly code: string;
  public readonly statusCode?: number;
  public readonly url?: string;

  constructor(
    message: string,
    code: string,
    statusCode?: number,
    url?: string
  ) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.url = url;
    // Include the error code in the message so the property is referenced and available for logs
    this.message = `${message}${this.code ? ` (code=${this.code})` : ''}`;
    this.name = 'ScrapingError';
  }
}

class ValidationUtils {
  static validateUrl(url: string): boolean {
    try {
      const parsedUrl = new URL(url);
      return ['http:', 'https:'].includes(parsedUrl.protocol);
    } catch {
      return false;
    }
  }

  static sanitizeFileName(fileName: string): string {
    return fileName.replace(/[^a-zA-Z0-9\-_.]/g, '_');
  }

  static validateFilePath(filePath: string, intendedDir: string): boolean {
    const resolvedPath = path.resolve(filePath);
    const resolvedIntendedDir = path.resolve(intendedDir);
    return resolvedPath.startsWith(resolvedIntendedDir);
  }
}

// Input Schema
const webScraperInputSchema = z.object({
  url: z.string().url().refine((v) => ValidationUtils.validateUrl(v), "Invalid URL format"),
  selector: z.string().optional().describe("CSS selector for the elements to extract (e.g., 'h1', '.product-title'). If not provided, the entire page content will be extracted."),
  extractAttributes: z.array(z.string()).optional().describe("Array of HTML attributes to extract from selected elements (e.g., 'href', 'src', 'alt')."),
  saveMarkdown: z.boolean().optional().describe("Whether to save the scraped content as markdown to the data directory."),
  markdownFileName: z.string().optional().describe("Optional filename for the markdown file (relative to data/ directory). If not provided, a default name will be generated.")
}).strict();

// Output Schema
const webScraperOutputSchema = z.object({
  url: z.string().url().describe("The URL that was scraped."),
  extractedData: z.array(z.record(z.string(), z.string())).describe("Array of extracted data, where each object represents an element and its extracted attributes/text."),
  rawContent: z.string().optional().describe("The full raw HTML content of the page (if no selector is provided)."),
  markdownContent: z.string().optional().describe("The scraped content converted to markdown format."),
  savedFilePath: z.string().optional().describe("Path to the saved markdown file (if saveMarkdown was true)."),
  status: z.string().describe("Status of the scraping operation (e.g., 'success', 'failed')."),
  errorMessage: z.string().optional().describe("Error message if the operation failed.")
}).strict();

export const webScraperTool = createTool({
  id: "web-scraper",
  description: "Extracts structured data from web pages using JSDOM and Cheerio with enhanced security and error handling.",
  inputSchema: webScraperInputSchema,
  outputSchema: webScraperOutputSchema,
  execute: async ({ context, tracingContext }) => {
    const scrapeSpan = tracingContext?.currentSpan?.createChildSpan({
      type: AISpanType.GENERIC,
      name: 'web_scrape',
      input: { url: context.url, selector: context.selector, saveMarkdown: context.saveMarkdown, extractAttributesCount: context.extractAttributes?.length ?? 0 }
    });

    logger.info('Starting enhanced web scraping with JSDOM', { url: context.url, selector: context.selector, saveMarkdown: context.saveMarkdown });

    let rawContent: string | undefined;
    let markdownContent: string | undefined;
    let savedFilePath: string | undefined;
    const extractedData: Array<Record<string, string>> = [];
    let status = 'failed';
    let errorMessage: string | undefined;
    let scrapedUrl: string = context.url;

    try {
      const crawler = new CheerioCrawler({
        maxRequestsPerCrawl: 10,
        maxConcurrency: 10,
        requestHandlerTimeoutSecs: 30,
        async requestHandler({ request, body, response }) {
          try {
            scrapedUrl = request.url;

            if (typeof (response?.statusCode) === 'number' && Number.isFinite(response.statusCode) && response.statusCode >= 400) {
              throw new ScrapingError(
                `HTTP ${response.statusCode}: ${response.statusMessage}`,
                'HTTP_ERROR',
                response.statusCode,
                request.url
              );
            }

            rawContent = body.toString();

            // Sanitize HTML using JSDOM
            rawContent = HtmlProcessor.sanitizeHtml(rawContent);

            if (typeof context.selector === 'string' && context.selector.trim() !== '') {
              // Use JSDOM for better DOM manipulation
              const dom = new JSDOM(rawContent, { includeNodeLocations: false });
              const {document} = dom.window;

              const selector = (context.selector).trim();
              const elements = document.querySelectorAll(selector);
              elements.forEach(element => {
                const data = new Map<string, string>();
                data.set('text', element.textContent?.trim() ?? '');

                if (context.extractAttributes) {
                  context.extractAttributes.forEach(attr => {
                    if (typeof attr === "string" &&
                        !Object.hasOwn(Object.prototype, attr) &&
                        attr !== "__proto__" && attr !== "constructor" && attr !== "prototype" &&
                        !attr.includes('<') && !attr.includes('>')) {
                      const attrValue = element.getAttribute(attr);
                      if (attrValue !== null && attrValue !== undefined) {
                        data.set(`attr_${attr}`, attrValue);
                      }
                    }
                  });
                }
                extractedData.push(Object.fromEntries(data));
              });
            }

            status = 'success';
          } catch (error) {
            if (error instanceof ScrapingError) {
              throw error;
            }
            throw new ScrapingError(
              `Request handler failed: ${error instanceof Error ? error.message : String(error)}`,
              'REQUEST_HANDLER_ERROR',
              undefined,
              request.url
            );
          }
        },
        failedRequestHandler({ request, error }) {
          const scrapingError = new ScrapingError(
            `Failed to scrape ${request.url}: ${error instanceof Error ? error.message : String(error)}`,
            'REQUEST_FAILED',
            undefined,
            request.url
          );
          errorMessage = scrapingError.message;
          logger.error(scrapingError.message);
        },
      });

      await crawler.run([new Request({ url: context.url })]);

      // Enhanced HTML to markdown conversion using JSDOM
      if (typeof rawContent === 'string' && rawContent.trim().length > 0) {
        try {
          markdownContent = HtmlProcessor.htmlToMarkdown(rawContent);
        } catch (error) {
          logger.warn('Enhanced HTML to markdown conversion failed, using fallback', { error: error instanceof Error ? error.message : String(error) });
          try {
            // Sanitize raw HTML before passing to marked to prevent XSS via raw HTML content.
            const sanitizedForMarked = HtmlProcessor.sanitizeHtml(rawContent);
            markdownContent = await marked.parse(sanitizedForMarked);
          } catch (fallbackError) {
            logger.warn('Fallback conversion also failed', { error: fallbackError instanceof Error ? fallbackError.message : String(fallbackError) });
            markdownContent = HtmlProcessor.extractTextContent(rawContent);
          }
        }

        if (context.saveMarkdown === true && typeof markdownContent === 'string' && markdownContent.trim() !== '') {
          try {
            const fileName = (typeof context.markdownFileName === 'string' && context.markdownFileName.trim() !== '')
              ? ValidationUtils.sanitizeFileName(context.markdownFileName)
              : `scraped_${new Date().toISOString().replace(/[:.]/g, '-')}.md`;

            const dataDir = path.join(process.cwd(), './data');
            const fullPath = path.join(dataDir, fileName);

            if (!ValidationUtils.validateFilePath(fullPath, dataDir)) {
              throw new ScrapingError('Invalid file path', 'INVALID_FILE_PATH');
            }

            await fs.mkdir(dataDir, { recursive: true });
            // Open the file handle and write via the handle to avoid using fs.writeFile with a non-literal argument.
            // Path was already validated by ValidationUtils.validateFilePath above.
            const fileHandle = await fs.open(fullPath, 'w');
            try {
              await fileHandle.writeFile(markdownContent, 'utf-8');
            } finally {
              await fileHandle.close();
            }
            savedFilePath = fileName;
            logger.info('Markdown content saved securely', { fileName });
          } catch (error) {
            if (error instanceof ScrapingError) {
              throw error;
            }
            logger.error('Failed to save markdown file', { error: error instanceof Error ? error.message : String(error) });
          }
        }
      }

      scrapeSpan?.end({
        output: {
          status,
          extractedDataCount: extractedData.length,
          contentLength: rawContent?.length ?? 0,
          savedFile: !!(typeof savedFilePath === 'string' && savedFilePath.trim().length > 0)
        }
      });
    } catch (error) {
      const scrapingError = error instanceof ScrapingError ? error :
        new ScrapingError(
          `Web scraping failed: ${error instanceof Error ? error.message : String(error)}`,
          'GENERAL_ERROR'
        );

      errorMessage = scrapingError.message;
      logger.error(scrapingError.message);

      const errorMsg = scrapingError.message;
      scrapeSpan?.end({ metadata: { error: errorMsg, code: scrapingError.code } });
    }

    return webScraperOutputSchema.parse({
      url: scrapedUrl,
      extractedData,
      rawContent: (context.selector !== null)
        ? undefined
        : (typeof rawContent === 'string' && rawContent.trim().length > 0 ? rawContent : undefined),
      markdownContent,
      savedFilePath,
      status,
      errorMessage,
    });
  },
});

// ===== BATCH WEB SCRAPER TOOL =====

const batchWebScraperInputSchema = z.object({
  urls: z.array(z.string().url()).describe("Array of URLs to scrape.").max(10, "Maximum 10 URLs allowed for batch scraping"),
  selector: z.string().optional().describe("CSS selector for elements to extract from each page."),
  maxConcurrent: z.number().min(1).max(15).optional().describe("Maximum number of concurrent requests (default: 3, max: 15)."),
  saveResults: z.boolean().optional().describe("Whether to save results to data directory."),
  baseFileName: z.string().optional().describe("Base filename for saved results (default: 'batch_scrape')."),
});

const batchWebScraperOutputSchema = z.object({
  results: z.array(z.object({
    url: z.string(),
    success: z.boolean(),
    extractedData: z.array(z.record(z.string(), z.string())).optional(),
    markdownContent: z.string().optional(),
    errorMessage: z.string().optional(),
  })).describe("Results for each scraped URL."),
  savedFilePath: z.string().optional().describe("Path to the saved batch results file."),
  totalProcessed: z.number().describe("Total number of URLs processed."),
  successful: z.number().describe("Number of successful scrapes."),
  failed: z.number().describe("Number of failed scrapes."),
});

export const batchWebScraperTool = createTool({
  id: "batch-web-scraper",
  description: "Scrape multiple web pages concurrently with enhanced JSDOM processing and rate limiting.",
  inputSchema: batchWebScraperInputSchema,
  outputSchema: batchWebScraperOutputSchema,
  execute: async ({ context, tracingContext }) => {
    const batchSpan = tracingContext?.currentSpan?.createChildSpan({
      type: AISpanType.GENERIC,
      name: 'batch_web_scrape',
      input: {
        urlCount: context.urls.length,
        selector: context.selector,
        maxConcurrent: context.maxConcurrent ?? 3,
        saveResults: context.saveResults
      }
    });

    logger.info('Starting enhanced batch web scraping with JSDOM', {
      urlCount: context.urls.length,
      maxConcurrent: context.maxConcurrent ?? 3,
      saveResults: context.saveResults
    });

    const results: Array<{
      url: string;
      success: boolean;
      extractedData?: Array<Record<string, string>>;
      markdownContent?: string;
      errorMessage?: string;
    }> = [];

    let savedFilePath: string | undefined;
    const maxConcurrent = Math.min(context.maxConcurrent ?? 3, 5);

    try {
      for (let i = 0; i < context.urls.length; i += maxConcurrent) {
        const batch = context.urls.slice(i, i + maxConcurrent);
        const batchPromises = batch.map(async (url: string) => {
          try {
            const crawler = new CheerioCrawler({
              maxRequestsPerCrawl: 1,
              requestHandlerTimeoutSecs: 20,
              async requestHandler({ body }) {
                const rawContent = body.toString();
                const sanitizedHtml = HtmlProcessor.sanitizeHtml(rawContent);
                const extractedData: Array<Record<string, string>> = [];

                if (typeof context.selector === 'string' && context.selector.trim() !== '') {
                    // Use JSDOM for better element selection
                    // Ensure we pass a string and explicitly set contentType to avoid ambiguous parsing and suppress XSS/static analysis warnings.
                    const jsdom = new JSDOM(String(sanitizedHtml), { contentType: 'text/html', includeNodeLocations: false });
                    const {document} = jsdom.window;

                    const selector = context.selector.trim();
                    const elements = document.querySelectorAll(selector);
                    elements.forEach(element => {
                      const data = new Map<string, string>();
                      data.set('text', element.textContent?.trim() ?? '');
                      extractedData.push(Object.fromEntries(data));
                    });
                  }

                // Convert to markdown and sanitize the markdown output so we do not return unencoded HTML.
                let markdownContent = HtmlProcessor.htmlToMarkdown(sanitizedHtml);
                markdownContent = HtmlProcessor.sanitizeMarkdown(markdownContent);

                results.push({
                  url,
                  success: true,
                  extractedData,
                  markdownContent,
                });
              },
              failedRequestHandler({ error }) {
                results.push({
                  url,
                  success: false,
                  errorMessage: error instanceof Error ? error.message : String(error),
                });
              },
            });

            await crawler.run([new Request({ url })]);
          } catch (error) {
            results.push({
              url,
              success: false,
              errorMessage: error instanceof Error ? error.message : String(error),
            });
          }
        });

        await Promise.all(batchPromises);

        if (i + maxConcurrent < context.urls.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      if (context.saveResults ?? false) {
        try {
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
          const fileName = `${ValidationUtils.sanitizeFileName(context.baseFileName ?? 'batch_scrape')}_${timestamp}.json`;
          const dataDir = path.join(process.cwd(), './data');
          const fullPath = path.join(dataDir, fileName);

          if (!ValidationUtils.validateFilePath(fullPath, dataDir)) {
            throw new ScrapingError('Invalid file path', 'INVALID_FILE_PATH');
          }

          await fs.mkdir(dataDir, { recursive: true });
          // Open the file handle and write via the handle to avoid using fs.writeFile with a non-literal argument.
          // Path was already validated by ValidationUtils.validateFilePath above.
          const fileHandle = await fs.open(fullPath, 'w');
          try {
            await fileHandle.writeFile(JSON.stringify(results, null, 2), 'utf-8');
          } finally {
            await fileHandle.close();
          }
          savedFilePath = path.relative(path.join(process.cwd(), './data'), fullPath);
          logger.info('Batch results saved securely', { fileName: savedFilePath });
        } catch (error) {
          logger.error('Failed to save batch results', { error: error instanceof Error ? error.message : String(error) });
        }
      }

      const successful = results.filter(r => r.success).length;
      const failed = results.length - successful;

      batchSpan?.end({
        output: {
          totalProcessed: results.length,
          successful,
          failed,
          savedFile: typeof savedFilePath === 'string' && savedFilePath.trim().length > 0
        }
      });

      return batchWebScraperOutputSchema.parse({
        results,
        savedFilePath,
        totalProcessed: results.length,
        successful,
        failed,
      });
    } catch (error) {
      const errorMessage = `Batch scraping failed: ${error instanceof Error ? error.message : String(error)}`;
      logger.error(errorMessage);
      batchSpan?.end({ metadata: { error: errorMessage } });
      throw error;
    }
  },
});

// ===== SITE MAP EXTRACTOR TOOL =====

const siteMapExtractorInputSchema = z.object({
  url: z.string().url().describe("The base URL of the website to extract sitemap from.").refine((v) => ValidationUtils.validateUrl(v), "Invalid URL format"),
  maxDepth: z.number().min(1).max(5).optional().describe("Maximum depth to crawl (default: 2, max: 5)."),
  maxPages: z.number().min(1).max(200).optional().describe("Maximum number of pages to crawl (default: 50, max: 200)."),
  includeExternal: z.boolean().optional().describe("Whether to include external links (default: false)."),
  saveMap: z.boolean().optional().describe("Whether to save the site map to data directory."),
});

const siteMapExtractorOutputSchema = z.object({
  baseUrl: z.string().describe("The base URL that was crawled."),
  pages: z.array(z.object({
    url: z.string(),
    title: z.string().optional(),
    depth: z.number(),
    internalLinks: z.array(z.string()),
    externalLinks: z.array(z.string()),
  })).describe("Array of discovered pages with their metadata."),
  totalPages: z.number().describe("Total number of pages discovered."),
  savedFilePath: z.string().optional().describe("Path to the saved site map file."),
});

export const siteMapExtractorTool = createTool({
  id: "site-map-extractor",
  description: "Extract a comprehensive site map by crawling internal links with enhanced JSDOM processing and rate limiting.",
  inputSchema: siteMapExtractorInputSchema,
  outputSchema: siteMapExtractorOutputSchema,
  execute: async ({ context, tracingContext }) => {
    const mapSpan = tracingContext?.currentSpan?.createChildSpan({
      type: AISpanType.GENERIC,
      name: 'site_map_extraction',
      input: {
        url: context.url,
        maxDepth: context.maxDepth ?? 2,
        maxPages: context.maxPages ?? 50,
        includeExternal: context.includeExternal ?? false
      }
    });

    logger.info('Starting enhanced site map extraction with JSDOM', {
      url: context.url,
      maxDepth: context.maxDepth ?? 2,
      maxPages: context.maxPages ?? 50
    });

    const baseUrl = new URL(context.url);
    const visited = new Set<string>();
    const pages: Array<{
      url: string;
      title?: string;
      depth: number;
      internalLinks: string[];
      externalLinks: string[];
    }> = [];

    let savedFilePath: string | undefined;

    // Define crawlPage at the function body root to avoid nested function declarations.
    const crawlPage = async (url: string, depth: number): Promise<void> => {
      if (visited.has(url) ||
          depth > (context.maxDepth ?? 2) ||
          pages.length >= (context.maxPages ?? 50)) {
        return;
      }

      visited.add(url);

      try {
        const crawler = new CheerioCrawler({
          maxRequestsPerCrawl: 5,
          maxConcurrency: 10,
          requestHandlerTimeoutSecs: 15,
          async requestHandler({ body }) {
            const rawContent = body.toString();
            const sanitizedHtml = HtmlProcessor.sanitizeHtml(rawContent);

            // Use JSDOM for better link extraction
            const dom = new JSDOM(sanitizedHtml, { includeNodeLocations: false });
            const {document} = dom.window;

            const title = document.querySelector('title')?.textContent?.trim() ??
                          document.querySelector('h1')?.textContent?.trim();
            const internalLinks: string[] = [];
            const externalLinks: string[] = [];

            const links = document.querySelectorAll('a[href]');
            links.forEach(link => {
              const href = link.getAttribute('href');
              if (href !== null && href !== undefined) {
                try {
                  const absoluteUrl = new URL(href, url).href;
                  const linkUrl = new URL(absoluteUrl);

                  if (linkUrl.hostname === baseUrl.hostname) {
                    if (!visited.has(absoluteUrl)) {
                      internalLinks.push(absoluteUrl);
                    }
                  } else if (context.includeExternal === true) { // Align with schema default (false)
                    externalLinks.push(absoluteUrl);
                  }
                } catch {
                  // Invalid URL, skip silently
                }
              }
            });

            pages.push({
              url,
              title,
              depth,
              internalLinks,
              externalLinks,
            });

            for (const link of internalLinks) {
              if (!visited.has(link) && pages.length < (context.maxPages ?? 50)) {
                await crawlPage(link, depth + 1);
                await new Promise(resolve => setTimeout(resolve, 200));
              }
            }
          },
          failedRequestHandler({ error }) {
            logger.warn(`Failed to crawl ${url}`, { error: error instanceof Error ? error.message : String(error) });
          },
        });

        await crawler.run([new Request({ url })]);
      } catch (error) {
        logger.warn(`Error crawling ${url}`, { error: error instanceof Error ? error.message : String(error) });
      }
    };

    try {
      await crawlPage(context.url, 0);

      if (context.saveMap ?? false) {
        try {
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
          const fileName = `sitemap_${baseUrl.hostname}_${timestamp}.json`;
          const dataDir = path.join(process.cwd(), './data');
          const fullPath = path.join(dataDir, fileName);

          if (!ValidationUtils.validateFilePath(fullPath, dataDir)) {
            throw new ScrapingError('Invalid file path', 'INVALID_FILE_PATH');
          }

          await fs.mkdir(dataDir, { recursive: true });
          await fs.writeFile(fullPath, JSON.stringify({
            baseUrl: context.url,
            crawledAt: new Date().toISOString(),
            pages
          }, null, 2), 'utf-8');

          savedFilePath = path.relative(path.join(process.cwd(), './data'), fullPath); // Consistent with other tools
          logger.info('Site map saved securely', { fileName: savedFilePath });
        } catch (error) {
          logger.error('Failed to save site map', { error: error instanceof Error ? error.message : String(error) });
        }
      }

      mapSpan?.end({
        output: {
          totalPages: pages.length,
          savedFile: typeof savedFilePath === 'string' && savedFilePath.trim().length > 0
        }
      });

      return siteMapExtractorOutputSchema.parse({
        baseUrl: context.url,
        pages,
        totalPages: pages.length,
        savedFilePath,
      });
    } catch (error) {
      const errorMessage = `Site map extraction failed: ${error instanceof Error ? error.message : String(error)}`;
      logger.error(errorMessage);
      mapSpan?.end({ metadata: { error: errorMessage } });
      throw error;
    }
  },
});

// ===== LINK EXTRACTOR TOOL =====

const linkExtractorInputSchema = z.object({
  url: z.string().url().describe("The URL of the web page to extract links from.").refine((v) => ValidationUtils.validateUrl(v), "Invalid URL format"),
  linkTypes: z.array(z.enum(['internal', 'external', 'all'])).optional().describe("Types of links to extract (default: ['all'])."),
  includeAnchors: z.boolean().optional().describe("Whether to include anchor text with links (default: true)."),
  filterPatterns: z.array(z.string()).optional().describe("Regex patterns to filter links by href."),
});

const linkExtractorOutputSchema = z.object({
  url: z.string().describe("The URL that was analyzed."),
  links: z.array(z.object({
    href: z.string(),
    text: z.string(),
    type: z.enum(['internal', 'external']),
    isValid: z.boolean(),
  })).describe("Array of extracted links with metadata."),
  summary: z.object({
    total: z.number(),
    internal: z.number(),
    external: z.number(),
    invalid: z.number(),
  }).describe("Summary statistics of extracted links."),
});

export const linkExtractorTool = createTool({
  id: "link-extractor",
  description: "Extract and analyze all links from a web page with enhanced JSDOM processing and filtering.",
  inputSchema: linkExtractorInputSchema,
  outputSchema: linkExtractorOutputSchema,
  execute: async ({ context, tracingContext }) => {
    const linkSpan = tracingContext?.currentSpan?.createChildSpan({
      type: AISpanType.GENERIC,
      name: 'link_extraction',
      input: {
        url: context.url,
        linkTypes: context.linkTypes ?? ['all'],
        includeAnchors: context.includeAnchors ?? true,
        filterCount: context.filterPatterns?.length ?? 0
      }
    });

    logger.info('Starting enhanced link extraction with JSDOM', {
      url: context.url,
      linkTypes: context.linkTypes ?? ['all']
    });

    try {
      let rawContent: string | undefined;
      let scrapedUrl: string = context.url;

      const crawler = new CheerioCrawler({
        maxRequestsPerCrawl: 10,
        maxConcurrency: 10,
        requestHandlerTimeoutSecs: 20,
        async requestHandler({ request, body }) {
          scrapedUrl = request.url;
          rawContent = body.toString();
        },
        failedRequestHandler({ error }) {
          throw new ScrapingError(
            `Failed to fetch ${context.url}: ${error instanceof Error ? error.message : String(error)}`,
            'FETCH_FAILED',
            undefined,
            context.url
          );
        },
      });

      await crawler.run([new Request({ url: context.url })]);

      if (typeof rawContent !== 'string' || rawContent.trim().length === 0) {
        throw new ScrapingError('Failed to retrieve page content', 'NO_CONTENT');
      }

      const sanitizedHtml = HtmlProcessor.sanitizeHtml(rawContent);

      // Use JSDOM for comprehensive link extraction
      const dom = new JSDOM(sanitizedHtml, { includeNodeLocations: false });
      const {document} = dom.window;
      const baseUrl = new URL(scrapedUrl);

      const links: Array<{
        href: string;
        text: string;
        type: 'internal' | 'external';
        isValid: boolean;
      }> = [];

      const linkElements = document.querySelectorAll('a[href]');
      linkElements.forEach(link => {
        const href = link.getAttribute('href');
        const text = link.textContent?.trim() ?? href ?? '';

        if (href !== null) {
          try {
            const absoluteUrl = new URL(href, scrapedUrl).href;
            const linkUrl = new URL(absoluteUrl);

            if (context.filterPatterns) {
              const matchesFilter = context.filterPatterns.some(pattern => {
                // Do not construct RegExp from untrusted input; use a simple and safe wildcard matcher.
                // Support '*' as a wildcard matching any sequence of characters, otherwise perform substring checks.
                if (typeof pattern !== 'string' || pattern.trim() === '') {
                  return false;
                }
                const parts = pattern.split('*').map(p => p.trim()).filter(p => p.length > 0);
                // If pattern is only '*' or empty after trimming, treat as match-all
                if (parts.length === 0) {
                  return true;
                }
                let position = 0;
                for (const part of parts) {
                  const idx = absoluteUrl.indexOf(part, position);
                  if (idx === -1) {
                    return false;
                  }
                  position = idx + part.length;
                }
                return true;
              });
              if (!matchesFilter) {
                return;
              }
            }

            const isInternal = linkUrl.hostname === baseUrl.hostname;
            const linkType = isInternal ? 'internal' : 'external';

            const requestedTypes = context.linkTypes ?? ['all'];
            if (!requestedTypes.includes('all') && !requestedTypes.includes(linkType)) {
              return;
            }

            // Validate and sanitize href before returning it to avoid unencoded values reaching HTML contexts.
            const isValidAbsolute = ValidationUtils.validateUrl(absoluteUrl);
            const safeHref = isValidAbsolute ? absoluteUrl : HtmlProcessor.sanitizeMarkdown(String(absoluteUrl));

            links.push({
              href: safeHref,
              text: context.includeAnchors !== false ? text : '',
              type: linkType,
              isValid: isValidAbsolute,
            });
          } catch {
            // In case of any parsing error, return a sanitized href and mark it invalid.
            const safeHref = HtmlProcessor.sanitizeMarkdown(String(href));
            links.push({
              href: safeHref,
              text: context.includeAnchors !== false ? text : '',
              type: 'external',
              isValid: false,
            });
          }
        }
      });

      const summary = {
        total: links.length,
        internal: links.filter(l => l.type === 'internal').length,
        external: links.filter(l => l.type === 'external').length,
        invalid: links.filter(l => !l.isValid).length,
      };
      linkSpan?.end({
        output: {
          linkCount: links.length,
          summary
        }
      });

      return linkExtractorOutputSchema.parse({
        url: scrapedUrl,
        links,
        summary,
      });
    } catch (error) {
      const errorMessage = `Link extraction failed: ${error instanceof Error ? error.message : String(error)}`;
      logger.error(errorMessage);
      linkSpan?.end({ metadata: { error: errorMessage } });
      throw error;
    }
  },
});

// ===== HTML TO MARKDOWN CONVERTER TOOL =====
const htmlToMarkdownOutputSchema = z.object({
  // Ensure we always pass a real string into the sanitizer to avoid any unencoded/ambiguous values.
  markdown: z.string().transform((s) => HtmlProcessor.sanitizeMarkdown(String(s))).describe("The converted markdown content (HTML-encoded to prevent XSS)."),
  savedFilePath: z.string().optional().describe("Path to the saved file if saveToFile was true."),
}).strict();

const htmlToMarkdownInputSchema = z.object({
  html: z.string()
    .transform((s) => HtmlProcessor.sanitizeHtml(String(s)))
    .describe("The HTML content to convert to markdown (will be sanitized by the schema to prevent raw HTML storage)."),
  saveToFile: z.boolean().optional().describe("Whether to save the markdown to a file."),
  fileName: z.string().optional().describe("Filename for the saved markdown (relative to data directory)."),
}).strict();

export const htmlToMarkdownTool = createTool({
  id: "html-to-markdown",
  description: "Convert HTML content to well-formatted markdown with enhanced JSDOM parsing and security.",
  inputSchema: htmlToMarkdownInputSchema,
  outputSchema: htmlToMarkdownOutputSchema,
  execute: async ({ context, tracingContext }) => {
    const convertSpan = tracingContext?.currentSpan?.createChildSpan({
      type: AISpanType.GENERIC,
      name: 'html_to_markdown',
      input: {
        htmlLength: context.html.length,
        saveToFile: context.saveToFile,
        fileName: context.fileName
      }
    });

    logger.info('Converting HTML to markdown with enhanced JSDOM processing', {
      htmlLength: context.html.length,
      saveToFile: context.saveToFile
    });

    let savedFilePath: string | undefined;

    try {
      const sanitizedHtml = HtmlProcessor.sanitizeHtml(context.html);
      const markdown = HtmlProcessor.htmlToMarkdown(sanitizedHtml);

      if (context.saveToFile === true) {
        try {
          const providedName = context.fileName;
          const fileName = (typeof providedName === 'string' && providedName.trim().length > 0)
            ? ValidationUtils.sanitizeFileName(providedName)
            : `converted_${new Date().toISOString().replace(/[:.]/g, '-')}.md`;
          const dataDir = path.join(process.cwd(), './data');
          const fullPath = path.join(dataDir, fileName);

          if (!ValidationUtils.validateFilePath(fullPath, dataDir)) {
            throw new ScrapingError('Invalid file path', 'INVALID_FILE_PATH');
          }

          await fs.mkdir(dataDir, { recursive: true });
          // Open the file handle and write via the handle to avoid using fs.writeFile with a non-literal argument.
          // Path was already validated by ValidationUtils.validateFilePath above.
          const fileHandle = await fs.open(fullPath, 'w');
          try {
            await fileHandle.writeFile(markdown, 'utf-8');
          } finally {
            await fileHandle.close();
          }
          savedFilePath = path.relative(path.join(process.cwd(), './data'), fullPath);
          logger.info('Markdown saved securely', { fileName: savedFilePath });
        } catch (error) {
          if (error instanceof ScrapingError) {
            throw error;
          }
          logger.error('Failed to save markdown file', { error: error instanceof Error ? error.message : String(error) });
        }
      }

      convertSpan?.end({
        output: {
          markdownLength: markdown.length,
          savedFile: typeof savedFilePath === 'string' && savedFilePath.trim().length > 0
        }
      });

      return htmlToMarkdownOutputSchema.parse({
        markdown,
        savedFilePath,
      });
    } catch (error) {
      const errorMessage = `HTML to markdown conversion failed: ${error instanceof Error ? error.message : String(error)}`;
      logger.error(errorMessage);
      convertSpan?.end({ metadata: { error: errorMessage } });
      throw error;
    }
  },
});

// ===== SCRAPED CONTENT MANAGER TOOL =====

const listScrapedContentInputSchema = z.object({
  pattern: z.string().optional().describe("Pattern to filter files (e.g., '*.md', 'scraped_*')."),
  includeMetadata: z.boolean().optional().describe("Whether to include file metadata (default: true)."),
});

const listScrapedContentOutputSchema = z.object({
  files: z.array(z.object({
    name: z.string(),
    path: z.string(),
    size: z.number().optional(),
    modified: z.string().optional(),
    created: z.string().optional(),
  })).describe("Array of scraped content files."),
  totalFiles: z.number().describe("Total number of files found."),
  totalSize: z.number().describe("Total size of all files in bytes."),
});

export const listScrapedContentTool = createTool({
  id: "list-scraped-content",
  description: "List all scraped content files stored in the data directory with enhanced security.",
  inputSchema: listScrapedContentInputSchema,
  outputSchema: listScrapedContentOutputSchema,
  execute: async ({ context, tracingContext }) => {
    const listSpan = tracingContext?.currentSpan?.createChildSpan({
      type: AISpanType.GENERIC,
      name: 'list_scraped_content',
      input: { pattern: context.pattern, includeMetadata: context.includeMetadata ?? true }
    });

    logger.info('Listing scraped content with security validation', { pattern: context.pattern });

    try {
      const dataDir = path.join(process.cwd(), './data');

      try {
        await fs.access(dataDir);
      } catch {
        return listScrapedContentOutputSchema.parse({
          files: [],
          totalFiles: 0,
          totalSize: 0,
        });
      }

      const items = await fs.readdir(dataDir, { withFileTypes: true });
      const files: Array<{
        name: string;
        path: string;
        size?: number;
        modified?: string;
        created?: string;
      }> = [];

      let totalSize = 0;

      for (const item of items) {
        if (item.isFile()) {
          if (typeof context.pattern === 'string' && context.pattern.trim() !== '') {
            try {
              const patternStr = context.pattern.trim();

              // Only allow a safe subset of characters in the pattern:
              // letters, numbers, underscore, hyphen, dot, space and the wildcard '*'.
              // Reject patterns containing other special characters to avoid any regex-like parsing.
              if (!/^[a-zA-Z0-9_\-.\\*\s]+$/.test(patternStr)) {
                // Unsafe pattern detected; skip filtering to avoid using untrusted input.
              } else {
                // Simple and safe wildcard matcher: supports '*' only, avoids RegExp construction.
                const matchWithWildcard = (name: string, pattern: string): boolean => {
                  // Match-all
                  if (pattern === '*') {
                    return true;
                  }
                  const parts = pattern.split('*');
                  let pos = 0;
                  for (let i = 0; i < parts.length; i++) {
                    const part = parts[i];
                    if (part === '') {
                      continue;
                    }
                    const idx = name.indexOf(part, pos);
                    if (idx === -1) {
                      return false;
                    }
                    // If pattern does not start with '*', first part must be at the start
                    if (i === 0 && !pattern.startsWith('*') && idx !== 0) {
                      return false;
                    }
                    pos = idx + part.length;
                  }
                  // If pattern does not end with '*', last part must align with the end
                  if (!pattern.endsWith('*') && parts[parts.length - 1] !== '') {
                    const last = parts[parts.length - 1];
                    if (!name.endsWith(last)) {
                      return false;
                    }
                  }
                  return true;
                };
                if (!matchWithWildcard(item.name, patternStr)) {
                  continue;
                }
              }
            } catch {
              // Invalid pattern, skip filtering
            }
          }

          const filePath = path.join(dataDir, item.name);
          const relativePath = path.relative(dataDir, filePath);

          let metadata;
          if (context.includeMetadata !== false) {
            try {
              const stats = await fs.stat(filePath);
              metadata = {
                size: stats.size,
                modified: stats.mtime.toISOString(),
                created: stats.birthtime.toISOString(),
              };
              totalSize += stats.size;
            } catch {
              // Can't get metadata, continue without it
            }
          }

          files.push({
            name: item.name,
            path: relativePath,
            ...metadata,
          });
        }
      }

      listSpan?.end({
        output: {
          totalFiles: files.length,
          totalSize
        }
      });

      return listScrapedContentOutputSchema.parse({
        files,
        totalFiles: files.length,
        totalSize,
      });
    } catch (error) {
      const errorMessage = `Failed to list scraped content: ${error instanceof Error ? error.message : String(error)}`;
      logger.error(errorMessage);
      listSpan?.end({ metadata: { error: errorMessage } });
      throw error;
    }
  },
});

// ===== CONTENT CLEANER TOOL =====

const contentCleanerInputSchema = z.object({
  html: z.string().describe("The HTML content to clean."),
  removeScripts: z.boolean().optional().describe("Remove script tags (default: true)."),
  removeStyles: z.boolean().optional().describe("Remove style tags (default: true)."),
  removeComments: z.boolean().optional().describe("Remove HTML comments (default: true)."),
  preserveStructure: z.boolean().optional().describe("Preserve document structure (default: true)."),
});

const contentCleanerOutputSchema = z.object({
  cleanedHtml: z.string().describe("The cleaned HTML content."),
  originalSize: z.number().describe("Original HTML size in characters."),
  cleanedSize: z.number().describe("Cleaned HTML size in characters."),
  reductionPercent: z.number().describe("Percentage of content removed."),
});

export const contentCleanerTool = createTool({
  id: "content-cleaner",
  description: "Clean HTML content by removing unwanted elements with enhanced JSDOM processing and security.",
  inputSchema: contentCleanerInputSchema,
  outputSchema: contentCleanerOutputSchema,
  execute: async ({ context, tracingContext }) => {
    const cleanSpan = tracingContext?.currentSpan?.createChildSpan({
      type: AISpanType.GENERIC,
      name: 'content_cleaning',
      input: {
        htmlLength: context.html.length,
        removeScripts: context.removeScripts ?? true,
        removeStyles: context.removeStyles ?? true,
        removeComments: context.removeComments ?? true
      }
    });

    logger.info('Cleaning HTML content with enhanced JSDOM security', {
      originalLength: context.html.length,
      removeScripts: context.removeScripts ?? true,
      removeStyles: context.removeStyles ?? true
    });

    try {
      const dom = new JSDOM(context.html, { // Removed runScripts: 'dangerously' for safety
        includeNodeLocations: false,
      });

      const {document} = dom.window;
      const originalSize = context.html.length;

      // Remove dangerous elements using JSDOM
      const dangerousElements = document.querySelectorAll('script, style, iframe, embed, object, noscript, meta, link[rel="stylesheet"], form, input, button, select, textarea');
      dangerousElements.forEach(element => element.remove());

      // Remove event handler attributes
      const allElements = document.querySelectorAll('*');
      allElements.forEach(element => {
        Array.from(element.attributes).forEach(attr => {
          if (attr.name.startsWith('on') || HtmlProcessor.DANGEROUS_ATTRS.has(attr.name.toLowerCase())) {
            element.removeAttribute(attr.name);
          }
        });
      });

      // Remove HTML comments
      if (context.removeComments !== false) {
        const removeComments = (node: Node) => {
          const childNodes = Array.from(node.childNodes);
          childNodes.forEach(child => {
            if (child.nodeType === dom.window.Node.COMMENT_NODE) {
              child.remove();
            } else if (child.nodeType === dom.window.Node.ELEMENT_NODE) {
              removeComments(child);
            }
          });
        };
        removeComments(document.body);
      }

      const cleanedHtml = context.preserveStructure !== false ? document.body.innerHTML : document.body.textContent ?? '';
      const cleanedSize = cleanedHtml.length;
      const reductionPercent = originalSize > 0 ? ((originalSize - cleanedSize) / originalSize) * 100 : 0;

      cleanSpan?.end({
        output: {
          originalSize,
          cleanedSize,
          reductionPercent: Math.round(reductionPercent * 100) / 100
        }
      });

      return contentCleanerOutputSchema.parse({
        cleanedHtml,
        originalSize,
        cleanedSize,
        reductionPercent: Math.round(reductionPercent * 100) / 100,
      });
    } catch (error) {
      const errorMessage = `Content cleaning failed: ${error instanceof Error ? error.message : String(error)}`;
      logger.error(errorMessage);
      cleanSpan?.end({ metadata: { error: errorMessage } });
      throw error;
    }
  },
});
