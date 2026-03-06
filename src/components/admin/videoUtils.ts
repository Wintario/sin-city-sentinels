export type ExternalVideoProvider = 'youtube' | 'vk' | 'rutube';

export interface ExternalVideoData {
  provider: ExternalVideoProvider;
  videoId: string;
  embedUrl: string;
  thumbnailUrl: string;
}

const VIDEO_PLACEHOLDER_URL = '/video-placeholder.svg';

const normalizeUrl = (url: string): URL | null => {
  try {
    if (!/^https?:\/\//i.test(url)) {
      return new URL(`https://${url}`);
    }
    return new URL(url);
  } catch {
    return null;
  }
};

const parseYoutube = (url: URL): ExternalVideoData | null => {
  const host = url.hostname.toLowerCase();
  if (!host.includes('youtube.com') && !host.includes('youtu.be')) {
    return null;
  }

  let videoId = '';
  if (host.includes('youtu.be')) {
    videoId = url.pathname.split('/').filter(Boolean)[0] || '';
  } else {
    videoId = url.searchParams.get('v') || '';
  }

  if (!videoId) return null;
  return {
    provider: 'youtube',
    videoId,
    embedUrl: `https://www.youtube.com/embed/${videoId}`,
    thumbnailUrl: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
  };
};

const parseVk = (url: URL): ExternalVideoData | null => {
  const host = url.hostname.toLowerCase();
  if (!host.includes('vk.com')) {
    return null;
  }

  const match = url.pathname.match(/\/video(-?\d+)_([0-9]+)/i);
  if (!match) return null;

  const oid = match[1];
  const id = match[2];
  return {
    provider: 'vk',
    videoId: `${oid}_${id}`,
    embedUrl: `https://vk.com/video_ext.php?oid=${oid}&id=${id}`,
    thumbnailUrl: VIDEO_PLACEHOLDER_URL
  };
};

const parseRutube = (url: URL): ExternalVideoData | null => {
  const host = url.hostname.toLowerCase();
  if (!host.includes('rutube.ru')) {
    return null;
  }

  const match = url.pathname.match(/\/video\/([a-z0-9]+)/i);
  if (!match) return null;

  const videoId = match[1];
  return {
    provider: 'rutube',
    videoId,
    embedUrl: `https://rutube.ru/play/embed/${videoId}`,
    thumbnailUrl: VIDEO_PLACEHOLDER_URL
  };
};

export const parseExternalVideoUrl = (rawUrl: string): ExternalVideoData | null => {
  const normalized = normalizeUrl(rawUrl.trim());
  if (!normalized) return null;
  return parseYoutube(normalized) || parseVk(normalized) || parseRutube(normalized);
};

export const buildExternalVideoMarker = (data: ExternalVideoData) => {
  const encodedEmbed = encodeURIComponent(data.embedUrl);
  return `video:external:${encodedEmbed}`;
};

export const buildUploadedVideoMarker = (videoUrl: string) => {
  const encodedVideo = encodeURIComponent(videoUrl);
  return `video:upload:${encodedVideo}`;
};
