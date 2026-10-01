import { fs } from './filesystem';
import { soundManager } from './sound';
import { FSItem } from '../types/os';

export interface SearchResultItem {
  id: string;
  title: string;
  url: string;
  displayUrl: string;
  snippet: string;
  source: 'web' | 'wikipedia' | 'news' | 'github' | 'docs';
  date?: string;
  imageUrl?: string;
  articleText?: string;
  downloadables?: {
    name: string;
    type: 'txt' | 'md' | 'html' | 'json' | 'png' | 'sys';
    size: string;
    content: string;
  }[];
}

export interface KnowledgeCard {
  title: string;
  subtitle: string;
  description: string;
  imageUrl?: string;
  facts: { label: string; value: string }[];
  wikiUrl?: string;
}

export interface SearchResponse {
  query: string;
  knowledge?: KnowledgeCard;
  results: SearchResultItem[];
  images: { title: string; url: string; source: string; downloadName: string }[];
  downloadablePacks: {
    title: string;
    filename: string;
    type: 'txt' | 'md' | 'html' | 'json' | 'png' | 'sys';
    size: string;
    content: string;
    description: string;
  }[];
}

export interface DownloadHistoryItem {
  id: string;
  filename: string;
  size: string;
  timestamp: number;
  url: string;
  type: string;
  savedToWin11: boolean;
  savedToLocalDisk: boolean;
}

const DOWNLOAD_HISTORY_KEY = 'win11_browser_download_history';

// Curated comprehensive topic database for instant high-quality search grounding
const CURATED_KNOWLEDGE_TOPICS: Record<string, Partial<SearchResponse>> = {
  'windows 11': {
    knowledge: {
      title: 'Windows 11',
      subtitle: 'Operating System by Microsoft',
      description:
        'Windows 11 is the major release of the Windows NT operating system released in October 2021. It features a centered taskbar, rounded window corners, Mica and Acrylic translucent materials, Snap Layouts, integrated Virtual Desktops, and modern subsystem architecture.',
      imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
      facts: [
        { label: 'Developer', value: 'Microsoft Corporation' },
        { label: 'Kernel', value: 'Windows NT (x64, ARM64)' },
        { label: 'Initial Release', value: 'October 5, 2021' },
        { label: 'UI Shell', value: 'Fluent Design System & Mica' },
      ],
      wikiUrl: 'https://en.wikipedia.org/wiki/Windows_11',
    },
  },
  'react': {
    knowledge: {
      title: 'React.js',
      subtitle: 'The library for web and native user interfaces',
      description:
        'React lets you build user interfaces out of individual pieces called components. Create your own React components like Thumbnail, LikeButton, and Video, then combine them into entire screens, pages, and apps.',
      imageUrl: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&fit=crop&w=800&q=80',
      facts: [
        { label: 'Initial Release', value: 'May 2013' },
        { label: 'Platform', value: 'Web, Mobile, Desktop' },
        { label: 'License', value: 'MIT' },
        { label: 'Latest Version', value: 'React 19' },
      ],
      wikiUrl: 'https://en.wikipedia.org/wiki/React_(software)',
    },
  },
  'python': {
    knowledge: {
      title: 'Python',
      subtitle: 'High-level general-purpose programming language',
      description:
        'Python is an interpreted, high-level, general-purpose programming language emphasizing code readability with significant indentation. Supports multiple paradigms including structured, object-oriented, and functional programming.',
      imageUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&q=80',
      facts: [
        { label: 'Designer', value: 'Guido van Rossum' },
        { label: 'First Appeared', value: 'February 1991' },
        { label: 'Paradigm', value: 'Multi-paradigm' },
        { label: 'Typing', value: 'Dynamic, Duck typing' },
      ],
      wikiUrl: 'https://en.wikipedia.org/wiki/Python_(programming_language)',
    },
  },
  'artificial intelligence': {
    knowledge: {
      title: 'Artificial Intelligence',
      subtitle: 'Computer Science & Machine Learning',
      description:
        'Artificial intelligence (AI) is the intelligence of machines or software, as opposed to the intelligence of living beings, primarily of humans. It encompasses machine learning, deep neural networks, natural language processing, and autonomous agents.',
      imageUrl: 'https://images.unsplash.com/photo-1677442136019-21780efad99a?auto=format&fit=crop&w=800&q=80',
      facts: [
        { label: 'Subfields', value: 'Machine Learning, Robotics, NLP, Vision' },
        { label: 'Key Milestones', value: 'Turing Test (1950), Deep Blue (1997), Transformer (2017)' },
        { label: 'Applications', value: 'Autonomous driving, Healthcare, Search, Creative Gen' },
      ],
      wikiUrl: 'https://en.wikipedia.org/wiki/Artificial_intelligence',
    },
  },
};

class WebSearchService {
  private downloadHistory: DownloadHistoryItem[] = [];

  constructor() {
    this.loadHistory();
  }

  private loadHistory() {
    try {
      const data = localStorage.getItem(DOWNLOAD_HISTORY_KEY);
      if (data) {
        this.downloadHistory = JSON.parse(data);
      }
    } catch (_) {}
  }

  private saveHistory() {
    try {
      localStorage.setItem(DOWNLOAD_HISTORY_KEY, JSON.stringify(this.downloadHistory));
    } catch (_) {}
  }

  getDownloadHistory(): DownloadHistoryItem[] {
    return this.downloadHistory;
  }

  clearDownloadHistory() {
    this.downloadHistory = [];
    this.saveHistory();
  }

  /**
   * Search the live web for any query
   */
  async search(query: string): Promise<SearchResponse> {
    const q = query.trim();
    if (!q) {
      return {
        query: '',
        results: [],
        images: [],
        downloadablePacks: [],
      };
    }

    const cleanQuery = q.toLowerCase();
    let wikiResults: SearchResultItem[] = [];
    let knowledge: KnowledgeCard | undefined;
    let images: { title: string; url: string; source: string; downloadName: string }[] = [];

    // Check curated database first for rich preview
    for (const [key, data] of Object.entries(CURATED_KNOWLEDGE_TOPICS)) {
      if (cleanQuery.includes(key) || key.includes(cleanQuery)) {
        if (data.knowledge) knowledge = data.knowledge;
      }
    }

    // 1. Fetch live Wikipedia Search API (CORS origin=*)
    try {
      const wikiUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(
        q
      )}&utf8=&format=json&origin=*`;
      const res = await fetch(wikiUrl);
      if (res.ok) {
        const json = await res.json();
        const searchItems = json?.query?.search || [];

        wikiResults = searchItems.slice(0, 7).map((item: any) => {
          const cleanSnippet = item.snippet.replace(/<\/?[^>]+(>|$)/g, '');
          const pageTitle = item.title;
          const articleUrl = `https://en.wikipedia.org/wiki/${encodeURIComponent(pageTitle.replace(/ /g, '_'))}`;

          return {
            id: `wiki_${item.pageid}`,
            title: pageTitle,
            url: articleUrl,
            displayUrl: `en.wikipedia.org/wiki/${pageTitle}`,
            snippet: cleanSnippet + '...',
            source: 'wikipedia' as const,
            downloadables: [
              {
                name: `${pageTitle.replace(/[^a-zA-Z0-9_-]/g, '_')}_Article.txt`,
                type: 'txt' as const,
                size: `${Math.round(item.size / 1024) || 4} KB`,
                content: `Title: ${pageTitle}\nSource: Wikipedia\nURL: ${articleUrl}\n\n${cleanSnippet}\n\n[Full Article downloaded via Win11 Web OS Search]`,
              },
            ],
          };
        });

        // 2. If no curated knowledge card yet, fetch top Wikipedia article extract and thumbnail
        if (!knowledge && searchItems.length > 0) {
          const topTitle = searchItems[0].title;
          const detailsUrl = `https://en.wikipedia.org/w/api.php?action=query&prop=extracts|pageimages&exintro=&explaintext=&titles=${encodeURIComponent(
            topTitle
          )}&pithumbsize=600&format=json&origin=*`;
          const detRes = await fetch(detailsUrl);
          if (detRes.ok) {
            const detJson = await detRes.json();
            const pages = detJson?.query?.pages || {};
            const pageObj: any = Object.values(pages)[0];
            if (pageObj && pageObj.extract) {
              knowledge = {
                title: pageObj.title,
                subtitle: `Wikipedia Knowledge Base • ${q}`,
                description: pageObj.extract.slice(0, 480) + '...',
                imageUrl: pageObj.thumbnail?.source,
                facts: [
                  { label: 'Source', value: 'Wikipedia Open Encyclopedia' },
                  { label: 'Topic Match', value: q },
                  { label: 'License', value: 'Creative Commons CC BY-SA 4.0' },
                ],
                wikiUrl: `https://en.wikipedia.org/wiki/${encodeURIComponent(pageObj.title.replace(/ /g, '_'))}`,
              };
            }
          }
        }
      }
    } catch (_) {
      // Fallback gracefully if network offline
    }

    // 3. Fetch Hacker News stories if technical query
    let hnResults: SearchResultItem[] = [];
    try {
      const hnUrl = `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(q)}&tags=story&hitsPerPage=3`;
      const hnRes = await fetch(hnUrl);
      if (hnRes.ok) {
        const hnJson = await hnRes.json();
        const hits = hnJson?.hits || [];
        hnResults = hits.map((hit: any) => ({
          id: `hn_${hit.objectID}`,
          title: hit.title,
          url: hit.url || `https://news.ycombinator.com/item?id=${hit.objectID}`,
          displayUrl: hit.url ? new URL(hit.url).hostname : 'news.ycombinator.com',
          snippet: `${hit.points || 0} points • ${hit.num_comments || 0} comments • By ${hit.author}`,
          source: 'news' as const,
          date: new Date(hit.created_at).toLocaleDateString(),
        }));
      }
    } catch (_) {}

    // 4. Construct live web results combining live data and synthesized search intelligence
    const combinedResults: SearchResultItem[] = [
      ...wikiResults,
      ...hnResults,
      {
        id: `web_guide_${Date.now()}`,
        title: `Comprehensive Guide to ${q} - Overview, Architecture & Details`,
        url: `https://www.websearch.org/explore?q=${encodeURIComponent(q)}`,
        displayUrl: `www.websearch.org/explore/${encodeURIComponent(q)}`,
        snippet: `Explore essential background, key concepts, technical specifications, and download resources related to ${q}. Verified web document.`,
        source: 'web',
      },
      {
        id: `web_docs_${Date.now()}`,
        title: `${q} Official Documentation, Cheatsheets & Downloads`,
        url: `https://docs.web.os/${encodeURIComponent(q)}`,
        displayUrl: `docs.web.os/${encodeURIComponent(q)}`,
        snippet: `Complete developer specifications, code samples, reference manual, and offline package archives for ${q}.`,
        source: 'docs',
      },
    ];

    // 5. Generate high-res image results for this query
    const encodedTopic = encodeURIComponent(q);
    images = [
      {
        title: `${q} - Visual 1`,
        url: knowledge?.imageUrl || `https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80`,
        source: 'Unsplash / Web Photos',
        downloadName: `${q.replace(/[^a-zA-Z0-9_-]/g, '_')}_Photo1.png`,
      },
      {
        title: `${q} - Scenic Perspective`,
        url: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=800&q=80',
        source: 'Creative Commons',
        downloadName: `${q.replace(/[^a-zA-Z0-9_-]/g, '_')}_Scenic.png`,
      },
      {
        title: `${q} - Digital Concept Art`,
        url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80',
        source: 'Digital Arts Archive',
        downloadName: `${q.replace(/[^a-zA-Z0-9_-]/g, '_')}_Concept.png`,
      },
      {
        title: `${q} - Cyberpunk Neon`,
        url: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=800&q=80',
        source: 'Digital Arts Archive',
        downloadName: `${q.replace(/[^a-zA-Z0-9_-]/g, '_')}_Neon.png`,
      },
    ];

    // 6. Generate downloadable bundles for ANY search query!
    const summaryText = knowledge?.description || `Research overview and summary document regarding "${q}".\nGenerated by Win11 Web OS Search Engine on ${new Date().toLocaleString()}.\nKey topic: ${q}\nSource: Web Search Index & Encyclopedic Knowledge.`;

    const downloadablePacks: SearchResponse['downloadablePacks'] = [
      {
        title: `Research Summary Document`,
        filename: `${q.replace(/[^a-zA-Z0-9_-]/g, '_')}_Summary.txt`,
        type: 'txt',
        size: `${Math.max(1, Math.round(summaryText.length / 300))} KB`,
        content: `=====================================================\nWIN11 WEB OS - WEB SEARCH RESEARCH REPORT\nTOPIC: ${q.toUpperCase()}\nDATE: ${new Date().toLocaleString()}\n=====================================================\n\nOVERVIEW:\n${summaryText}\n\nKEY TAKEAWAYS:\n- Query: "${q}"\n- Results Indexed: ${combinedResults.length} web documents\n- Verification: Passed Win11 Web OS Security Check\n\nSEARCH REFERENCES:\n${combinedResults.map((r, i) => `[${i + 1}] ${r.title}\n    ${r.url}`).join('\n\n')}\n\n---\nSaved with Win11 Web OS Universal Downloader`,
        description: `Complete text research report covering ${q} with references and key facts.`,
      },
      {
        title: `Markdown Article & Notes`,
        filename: `${q.replace(/[^a-zA-Z0-9_-]/g, '_')}_Notes.md`,
        type: 'txt',
        size: `${Math.max(2, Math.round(summaryText.length / 250))} KB`,
        content: `# Research Notes: ${q}\n\n> Generated by Win11 Web OS Web Search on ${new Date().toLocaleDateString()}\n\n## Overview\n\n${summaryText}\n\n## Web Sources & Links\n\n${combinedResults.map((r) => `- [${r.title}](${r.url}) - *${r.snippet}*`).join('\n')}\n\n---\n*Win11 Web OS Storage - Downloads Folder*`,
        description: `Markdown formatted document ready for VS Code Lite, Obsidian, or Notepad.`,
      },
      {
        title: `Interactive HTML Webpage Archive`,
        filename: `${q.replace(/[^a-zA-Z0-9_-]/g, '_')}_Webpage.html`,
        type: 'txt',
        size: '5.4 KB',
        content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${q} - Web Archive</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0f172a; color: #f8fafc; padding: 40px; margin: 0; line-height: 1.6; }
    .container { max-width: 780px; margin: 0 auto; background: #1e293b; padding: 32px; border-radius: 16px; border: 1px solid rgba(255,255,255,0.1); box-shadow: 0 20px 40px rgba(0,0,0,0.5); }
    h1 { color: #60a5fa; margin-top: 0; border-bottom: 2px solid #3b82f6; padding-bottom: 12px; }
    .badge { display: inline-block; background: #2563eb; color: white; padding: 4px 12px; border-radius: 999px; font-size: 12px; font-weight: bold; margin-bottom: 16px; }
    .card { background: rgba(255,255,255,0.05); padding: 16px; border-radius: 8px; margin: 16px 0; border-left: 4px solid #3b82f6; }
    a { color: #38bdf8; text-decoration: none; }
    a:hover { text-decoration: underline; }
    footer { margin-top: 32px; text-align: center; color: #94a3b8; font-size: 13px; }
  </style>
</head>
<body>
  <div class="container">
    <span class="badge">WIN11 WEB OS ARCHIVE</span>
    <h1>${q}</h1>
    <div class="card">
      <p><strong>Overview:</strong> ${summaryText}</p>
    </div>
    <h2>Search Results & Links</h2>
    <ul>
      ${combinedResults.map((r) => `<li><a href="${r.url}" target="_blank">${r.title}</a><br><small style="color:#94a3b8">${r.snippet}</small></li>`).join('')}
    </ul>
    <footer>Downloaded via Win11 Web OS Universal Downloader • ${new Date().toLocaleString()}</footer>
  </div>
</body>
</html>`,
        description: `Self-contained HTML webpage that can be opened in any browser or VS Code Lite.`,
      },
      {
        title: `Raw Search Data (JSON)`,
        filename: `${q.replace(/[^a-zA-Z0-9_-]/g, '_')}_Dataset.json`,
        type: 'txt',
        size: '3.2 KB',
        content: JSON.stringify(
          {
            query: q,
            searchedAt: new Date().toISOString(),
            source: 'Win11 Web OS Search Engine',
            knowledge,
            results: combinedResults,
          },
          null,
          2
        ),
        description: `Complete JSON data payload with structured results and metadata.`,
      },
    ];

    return {
      query: q,
      knowledge,
      results: combinedResults,
      images,
      downloadablePacks,
    };
  }

  /**
   * Fetch full article content for reader mode
   */
  async fetchArticleDetails(title: string, originalUrl?: string): Promise<{
    title: string;
    content: string;
    url: string;
    imageUrl?: string;
  }> {
    try {
      const apiUrl = `https://en.wikipedia.org/w/api.php?action=query&prop=extracts|pageimages&titles=${encodeURIComponent(
        title
      )}&explaintext=1&pithumbsize=1000&format=json&origin=*`;
      const res = await fetch(apiUrl);
      if (res.ok) {
        const json = await res.json();
        const pages = json?.query?.pages || {};
        const page: any = Object.values(pages)[0];
        if (page && page.extract) {
          return {
            title: page.title,
            content: page.extract,
            url: originalUrl || `https://en.wikipedia.org/wiki/${encodeURIComponent(page.title.replace(/ /g, '_'))}`,
            imageUrl: page.thumbnail?.source,
          };
        }
      }
    } catch (_) {}

    return {
      title,
      content: `This article details "${title}".\n\nWin11 Reader Mode has indexed the primary information for this page. You can read it offline, export as Markdown, or download directly to your local PC disk and Win11 Downloads storage.\n\nOriginal URL: ${originalUrl || 'Web Document'}`,
      url: originalUrl || 'https://websearch.org',
    };
  }

  /**
   * Download directly to user's physical machine disk using Blob download
   */
  downloadToPhysicalComputer(filename: string, content: string | Blob, mimeType: string = 'text/plain') {
    soundManager.playClick();
    const blob = content instanceof Blob ? content : new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 10000);
    soundManager.playDing();

    this.recordDownload(filename, `${Math.round(blob.size / 1024) || 1} KB`, url, filename.split('.').pop() || 'txt', false, true);
  }

  /**
   * Download directly to Win11 Web OS Virtual Storage (Downloads folder)
   */
  downloadToWin11Storage(
    filename: string,
    content: string,
    type: 'txt' | 'png' | 'sys' = 'txt',
    targetFolder: string = 'downloads'
  ): FSItem {
    soundManager.playClick();
    const file = fs.createFile(filename, targetFolder, content, type);
    soundManager.playDing();

    this.recordDownload(
      filename,
      `${Math.round(content.length / 1024) || 1} KB`,
      `win11://${targetFolder}/${filename}`,
      type,
      true,
      false
    );

    return file;
  }

  /**
   * Universal Download: Saves to Win11 Web OS Storage AND user's real PC disk
   */
  downloadBoth(
    filename: string,
    content: string,
    type: 'txt' | 'png' | 'sys' = 'txt',
    mimeType: string = 'text/plain'
  ): FSItem {
    const file = this.downloadToWin11Storage(filename, content, type);
    this.downloadToPhysicalComputer(filename, content, mimeType);
    return file;
  }

  private recordDownload(
    filename: string,
    size: string,
    url: string,
    type: string,
    savedToWin11: boolean,
    savedToLocalDisk: boolean
  ) {
    const item: DownloadHistoryItem = {
      id: `dl_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      filename,
      size,
      timestamp: Date.now(),
      url,
      type,
      savedToWin11,
      savedToLocalDisk,
    };
    this.downloadHistory = [item, ...this.downloadHistory.slice(0, 49)];
    this.saveHistory();
  }
}

export const webSearchService = new WebSearchService();
