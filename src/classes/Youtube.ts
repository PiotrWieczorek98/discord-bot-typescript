import axios from 'axios'
import { ParsedUrlQueryInput, stringify } from 'querystring';

export interface YouTubeSearchOptions {
    q?: string,
    part?: string;
    fields?: string;
    channelId?: string;
    channelType?: string;
    eventType?: string;
    forContentOwner?: boolean;
    forDeveloper?: boolean;
    forMine?: boolean;
    id?: string;
    location?: string;
    locationRadius?: string;
    maxResults?: number;
    onBehalfOfContentOwner?: string;
    order?: string;
    pageToken?: string;
    publishedAfter?: string;
    publishedBefore?: string;
    regionCode?: string;
    relatedToVideoId?: string;
    relevanceLanguage?: string;
    safeSearch?: string;
    topicId?: string;
    type?: string;
    videoCaption?: string;
    videoCategoryId?: string;
    videoDefinition?: string;
    videoDimension?: string;
    videoDuration?: string;
    videoEmbeddable?: string;
    videoLicense?: string;
    videoSyndicated?: string;
    videoType?: string;
    key?: string;
}

export interface YouTubeThumbnail {
    url: string;
    width: number;
    height: number;
}

export interface YouTubeSearchResultThumbnails {
    default?: YouTubeThumbnail;
    medium?: YouTubeThumbnail;
    high?: YouTubeThumbnail;
    standard?: YouTubeThumbnail;
    maxres?: YouTubeThumbnail;
}

export interface YouTubeSearchResults {
    id: string;
    link: string;
    kind: string;
    publishedAt: string;
    channelTitle: string;
    channelId: string;
    title: string;
    description: string;
    thumbnails: YouTubeSearchResultThumbnails;
}

export interface YouTubeSearchPageResults {
    totalResults: number;
    resultsPerPage: number;
    nextPageToken: string;
    prevPageToken: string;
}

/**
 * Class allows usage of Youtube API v3
 */
export class Youtube{

    static searchByPhrase(term: string, opts?: YouTubeSearchOptions, cb?: Function) {

        if (opts == undefined){
          opts = {};
        }
      
        if (cb == undefined) {
          return new Promise<{results: YouTubeSearchResults[], pageInfo: YouTubeSearchPageResults}>(function (resolve, reject) {
            Youtube.searchByPhrase(term, opts, 
                function (err: Error, results: YouTubeSearchResults[], pageInfo: YouTubeSearchPageResults) {
              if (err) return reject(err)
              resolve({results: results, pageInfo: pageInfo})
            })
          })
        }
      
        // Required params
        opts.q = term;
        opts.part = opts.part || 'snippet';
        opts.maxResults= opts.maxResults || 30;
        opts.key = process.env['YOUTUBE_API_TOKEN']!;
      
        const url = 'https://www.googleapis.com/youtube/v3/search?' + stringify(opts as ParsedUrlQueryInput);
        axios.get(url)
          .then(function (response) {
            const result = response.data
      
            const pageInfo = {
              totalResults: result.pageInfo.totalResults,
              resultsPerPage: result.pageInfo.resultsPerPage,
              nextPageToken: result.nextPageToken,
              prevPageToken: result.prevPageToken
            }
      
            const findings = result.items.map(function (item: any) {
              let link = ''
              let id = ''
              switch (item.id.kind) {
                case 'youtube#channel':
                  link = 'https://www.youtube.com/channel/' + item.id.channelId
                  id = item.id.channelId
                  break
                case 'youtube#playlist':
                  link = 'https://www.youtube.com/playlist?list=' + item.id.playlistId
                  id = item.id.playlistId
                  break
                default:
                  link = 'https://www.youtube.com/watch?v=' + item.id.videoId
                  id = item.id.videoId
                  break
              }
      
              return {
                id: id,
                link: link,
                kind: item.id.kind,
                publishedAt: item.snippet.publishedAt,
                channelId: item.snippet.channelId,
                channelTitle: item.snippet.channelTitle,
                title: item.snippet.title,
                description: item.snippet.description,
                thumbnails: item.snippet.thumbnails
              }
            })
      
            return cb(null, findings, pageInfo)
          })
          .catch(function (err) {
            return cb(err)
          })
      }

    static searchById(id: string, opts?: YouTubeSearchOptions, cb?: Function) {

        if (opts == undefined){
          opts = {};
        }
      
        if (cb == undefined) {
          return new Promise<{results: YouTubeSearchResults[], pageInfo: YouTubeSearchPageResults}>(function (resolve, reject) {
            Youtube.searchById(id, opts, 
                function (err: Error, results: YouTubeSearchResults[], pageInfo: YouTubeSearchPageResults) {
              if (err) return reject(err)
              resolve({results: results, pageInfo: pageInfo})
            })
          })
        }
      
        // Required params
        opts.id = id;
        opts.part = opts.part || 'snippet';
        opts.maxResults= opts.maxResults || 30;
        opts.key = process.env['YOUTUBE_API_TOKEN']!;

        const url = 'https://www.googleapis.com/youtube/v3/videos?' + stringify(opts as ParsedUrlQueryInput);
        axios.get(url)
        .then(function (response) {
            const result = response.data
      
            const pageInfo = {
              totalResults: result.pageInfo.totalResults,
              resultsPerPage: result.pageInfo.resultsPerPage,
            }
      
            const findings = result.items.map(function (item: any) {
                const link = 'https://www.youtube.com/watch?v=' + item.id;
                const id = item.id;
        
                const result = {
                id: id,
                link: link,
                kind: item.id.kind,
                publishedAt: item.snippet.publishedAt,
                channelId: item.snippet.channelId,
                channelTitle: item.snippet.channelTitle,
                title: item.snippet.title,
                description: item.snippet.description,
                thumbnails: item.snippet.thumbnails
                }
                return result;
            })
      
            return cb(null, findings, pageInfo)
          })
          .catch(function (err) {
            return cb(err)
          })
      }

}