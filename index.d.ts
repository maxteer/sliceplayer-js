import prism from 'prism-media';

export interface SliceItem {
  type: 'video' | 'playlist' | 'search';
}

export interface YoutubeThumbnail {
  url: string;
  width: number;
  height: number;
}

export interface YoutubeVideoDetails {
  videoId: string;
  url: string;
  lengthSeconds: number | undefined;
  thumbnails: YoutubeThumbnail[];
  title: string;
  author: string;
  keywords: string;
  shortDescription: string;
  averageRating: number;
  viewCount: number;
  isLive: boolean;
  isLiveContent: boolean;
  liveUrl: string | null;
}

export interface YoutubeVideoFormat {
  mimeType: string;
  qualityLabel: string | null;
  bitrate: number;
  audioBitrate: number | null;
  url: string;
  isAdaptive: boolean;
  hasVideo: boolean;
  hasAudio: boolean;
  container: string;
  codecs: string;
  isLive: boolean;
  isHLS: boolean;
  isDashMPD: boolean;
  videoInfo?: {
    fps: number;
    width: number;
    height: number;
    quality: string;
  };
  audioInfo?: {
    sampleRate: string;
    averageBitrate: number;
    quality: string;
  };
}

export interface YoutubeVideo extends SliceItem {
  type: 'video';
  details: YoutubeVideoDetails;
  formats: YoutubeVideoFormat[];
}

export interface YoutubePlaylistDetails {
  id: string;
  url: string;
  thumbnails: YoutubeThumbnail[];
  title: string;
  author: string;
  /**
   * only avaiable in real youtube playlists.
   */
  videoCount?: number;
  /**
   * only avaiable in real youtube playlists.
   */
  viewCount?: number;
}

export interface YoutubePlaylistVideo {
  id: string;
  url: string;
  author: string;
  title: string;
  lengthSeconds: number;
  thumbnails: YoutubeThumbnail[];
  isLive: boolean;
  isPlayable: boolean;
}

export interface YoutubePlaylist extends SliceItem {
  type: 'playlist';
  details: YoutubePlaylistDetails;
  videos: YoutubePlaylistVideo[];
}

export interface YoutubeSearchItem {
  type: 'video' | 'playlist';
}

export interface YoutubeSearchVideoDetails {
  videoId: string;
  url: string;
  lengthSeconds: number;
  thumbnails: YoutubeThumbnail[];
  title: string;
  author: string;
  shortDescription: string;
  viewCount: number;
  isLive: boolean;
}

export interface YoutubeSearchVideo extends YoutubeSearchItem {
  type: 'video';
  details: YoutubeSearchVideoDetails;
}

export interface YoutubeSearchPlaylist extends YoutubeSearchItem {
  type: 'playlist';
  details: YoutubePlaylistDetails;
  videos: YoutubePlaylistVideo[];
}

export interface YoutubeSearch<YoutubeSearchItem> extends SliceItem {
  type: 'search';
  searchResults: YoutubeSearchItem[];
}

export interface YoutubeAPI {
  searchVideos(
    search: string,
    limit?: number,
  ): Promise<YoutubeSearch<YoutubeSearchVideo>>;
  searchPlaylists(
    search: string,
    limit?: number,
  ): Promise<YoutubeSearch<YoutubePlaylist>>;
  getVideo(videoId: string): Promise<YoutubeVideo>;
  getPlaylist(playlistId: string): Promise<YoutubePlaylist>;
}

export type SpotifyThumbnail = YoutubeThumbnail;

export interface SpotifyTrack {
  id: string;
  url: string;
  search: string;
}

export interface SpotifyArtist {
  id: string;
  url: string;
  thumbnails: SpotifyThumbnail[];
  title: string;
  author: string;
  tracks: SpotifyTrack[];
}

export interface SpotifyAlbum {
  id: string;
  url: string;
  thumbnails: SpotifyThumbnail[];
  title: string;
  author: string;
  tracks: SpotifyTrack[];
}

export interface SpotifyPlaylist {
  id: string;
  url: string;
  thumbnails: SpotifyThumbnail[];
  title: string;
  author: string;
  tracks: SpotifyTrack[];
}

export interface SpotifyAPI {
  getTrack(trackId: string): Promise<SpotifyTrack>;
  getArtist(artistId: string): Promise<SpotifyArtist>;
  getAlbum(albumId: string): Promise<SpotifyAlbum>;
  getPlaylist(playlistId: string): Promise<SpotifyPlaylist>;
}

export interface SpotifyConfig {
  clientId: string;
  clientSecret: string;
  splitSongsInParallel?: number;
}

export interface SlicePlayerOptions {
  spotifyConfig: SpotifyConfig;
}

export class SlicePlayer {
  constructor(options?: SlicePlayerOptions);
  youtube: YoutubeAPI;
  spotify: SpotifyAPI;
  loadItem(arg: string, search?: boolean): Promise<SliceItem>;
  videoToStream(video: YoutubeVideo): prism.opus.Encoder;
}

export default SlicePlayer;
