// app/page.tsx
'use client';

export const dynamic = 'force-dynamic';

import { useUser } from '@clerk/nextjs';
import { useState, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  Download, X, Play, FolderOpen, Image, Video, Copy, Check, Upload,
  Music, ExternalLink, Volume2, VolumeX, Trash2, Share2, Clock, Loader2
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import { supabase } from '@/lib/supabase';

interface MediaFile {
  url: string;
  type: string;
  name: string;
  id: string;
  size?: number;
  date?: string;
  format?: string;
  dbId?: string;
}

// Helper to determine file type from filename/extension
const getFileTypeFromName = (name: string): 'image' | 'video' | 'audio' | 'other' => {
  const ext = name.split('.').pop()?.toLowerCase() || '';
  const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico', 'avif'];
  const videoExts = ['mp4', 'mov', 'webm', 'avi', 'mkv', 'flv', 'wmv', 'm4v'];
  const audioExts = ['mp3', 'wav', 'aac', 'flac', 'ogg', 'm4a', 'wma', 'aiff'];
  if (imageExts.includes(ext)) return 'image';
  if (videoExts.includes(ext)) return 'video';
  if (audioExts.includes(ext)) return 'audio';
  return 'other';
};

// Helper to get file type from URL
const getFileTypeFromUrl = (url: string): 'image' | 'video' | 'audio' | 'other' => {
  if (!url) return 'other';
  const urlLower = url.toLowerCase();
  if (urlLower.includes('.jpg') || urlLower.includes('.jpeg') || urlLower.includes('.png') || 
      urlLower.includes('.gif') || urlLower.includes('.webp') || urlLower.includes('.svg') ||
      urlLower.includes('.bmp') || urlLower.includes('.ico')) {
    return 'image';
  }
  if (urlLower.includes('.mp4') || urlLower.includes('.mov') || urlLower.includes('.webm') || 
      urlLower.includes('.avi') || urlLower.includes('.mkv') || urlLower.includes('.flv') ||
      urlLower.includes('.wmv') || urlLower.includes('.m4v')) {
    return 'video';
  }
  if (urlLower.includes('.mp3') || urlLower.includes('.wav') || urlLower.includes('.aac') || 
      urlLower.includes('.flac') || urlLower.includes('.ogg') || urlLower.includes('.m4a') ||
      urlLower.includes('.wma') || urlLower.includes('.aiff')) {
    return 'audio';
  }
  return 'other';
};

function LoadingScreen({ text }: { text: string }) {
  const [visibleChars, setVisibleChars] = useState(0);
  const [showCreator, setShowCreator] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisibleChars(prev => {
        if (prev >= text.length) {
          clearInterval(interval);
          setTimeout(() => setShowCreator(true), 300);
          return prev;
        }
        return prev + 1;
      });
    }, 80);
    return () => clearInterval(interval);
  }, [text]);

  return (
    <div className="flex flex-col items-center gap-4 sm:gap-6 px-4">
      <div className="flex items-center gap-1 flex-wrap justify-center">
        {text.split('').map((char, index) => (
          <span key={index}
            className={`text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold transition-all duration-300 ease-out ${
              index < visibleChars ? 'opacity-100 text-black' : 'opacity-0 text-gray-300'
            }`}
            style={{
              transform: index < visibleChars ? 'translate(0,0) scale(1) rotate(0deg)' : `translate(${index % 2 === 0 ? '-60px' : '60px'}, ${index % 3 === 0 ? '-30px' : '30px'}) scale(0.3) rotate(${index % 2 === 0 ? 180 : -180}deg)`,
              transitionDelay: `${index * 20}ms`,
              transitionDuration: '300ms'
            }}
          >
            {char === ' ' ? '\u00A0' : char}
          </span>
        ))}
      </div>
      <div className={`transition-all duration-700 ease-out ${showCreator ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        <p className="text-xs sm:text-sm text-gray-500 font-light tracking-wide text-center">Created by <span className="font-medium text-gray-700">Kafiswe Chimputu Jr</span></p>
      </div>
      {visibleChars >= text.length && (
        <div className="flex items-center gap-1.5 mt-2">
          <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-black rounded-full animate-bounce" />
          <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
          <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
        </div>
      )}
    </div>
  );
}

export default function Home() {
  const { user, isLoaded, isSignedIn } = useUser();
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<MediaFile | null>(null);
  const [hoveredVideo, setHoveredVideo] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeTab, setActiveTab] = useState<'all' | 'videos' | 'audio' | 'images'>('all');
  const [videoMuted, setVideoMuted] = useState<{ [key: string]: boolean }>({});
  const [loadingFiles, setLoadingFiles] = useState(true);
  const [videoDuration, setVideoDuration] = useState<{ [key: string]: string }>({});
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const videoRefs = useRef<{ [key: string]: HTMLVideoElement | null }>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || '';

  useEffect(() => {
    if (user?.id) {
      console.log('🔍 User detected, loading files...');
      loadUserFiles();
    }
  }, [user?.id]);

  const loadUserFiles = async () => {
    setLoadingFiles(true);
    try {
      console.log('📡 Fetching files for user:', user?.id);
      const { data, error } = await supabase
        .from('files')
        .select('*')
        .eq('user_id', user?.id)
        .order('uploaded_at', { ascending: false });

      if (error) {
        console.error('❌ Error loading files:', error);
        toast.error('Failed to load your files');
        setMediaFiles([]);
        return;
      }

      console.log(`✅ Loaded ${data?.length || 0} files`);
      if (data) {
        const files: MediaFile[] = data.map((row: any) => {
          // Try to get file type from stored type, then URL, then filename
          let fileType = row.file_type || 'other';
          
          // If stored type is not reliable, check URL
          if (fileType === 'other' || fileType === 'raw') {
            const urlType = getFileTypeFromUrl(row.file_url || '');
            if (urlType !== 'other') {
              fileType = urlType;
            } else {
              // Fallback to filename
              fileType = getFileTypeFromName(row.file_name || '');
            }
          }
          
          return {
            url: row.file_url || '',
            type: fileType,
            name: row.file_name || 'unnamed',
            id: row.cloudinary_id || row.id || '',
            size: row.file_size || 0,
            date: row.uploaded_at || '',
            format: row.format || '',
            dbId: row.id || '',
          };
        });
        setMediaFiles(files);
      }
    } catch (err) {
      console.error('❌ Failed to load files:', err);
      toast.error('Failed to load your files');
      setMediaFiles([]);
    } finally {
      setLoadingFiles(false);
    }
  };

  const MAX_STORAGE = 500 * 1024 * 1024;
  const totalStorage = mediaFiles.reduce((total, file) => total + (file.size || 0), 0);
  const storagePercent = Math.round((totalStorage / MAX_STORAGE) * 100);

  if (!isLoaded) {
    return <div className="min-h-screen bg-white flex items-center justify-center p-4"><LoadingScreen text="MediaStore" /></div>;
  }

  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="text-center">
          <FolderOpen className="w-16 h-16 sm:w-20 sm:h-20 text-gray-300 mx-auto mb-4" />
          <p className="text-lg sm:text-xl text-gray-600 mb-2">Welcome to MediaStore</p>
          <p className="text-sm sm:text-base text-gray-400">Please sign in to continue</p>
          <p className="text-xs text-gray-400 mt-4">Created by Kafiswe Chimputu Jr</p>
        </div>
      </div>
    );
  }

  const filteredFiles = mediaFiles.filter((file) => {
    const fileName = (file.name || '').toLowerCase();
    const query = (searchQuery || '').toLowerCase();
    const matchesSearch = fileName.includes(query);
    if (activeTab === 'all') return matchesSearch;
    if (activeTab === 'videos') return matchesSearch && file.type === 'video';
    if (activeTab === 'images') return matchesSearch && file.type === 'image';
    if (activeTab === 'audio') return matchesSearch && file.type === 'audio';
    return matchesSearch;
  });

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
  };

  const getFileIcon = (file: MediaFile) => {
    if (file.type === 'image') return <Image className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />;
    if (file.type === 'video') return <Video className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />;
    if (file.type === 'audio') return <Music className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />;
    return <FileIcon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />;
  };

  function FileIcon({ className }: { className?: string }) {
    return (
      <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/>
      </svg>
    );
  }

  const handleDownload = (url: string, fileName: string) => {
    try {
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Download started');
    } catch (error) {
      toast.error('Failed to download');
    }
  };

  const handleDelete = async (file: MediaFile, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Delete "${file.name}"?`)) return;

    if (file.dbId) {
      const { error } = await supabase.from('files').delete().eq('id', file.dbId);
      if (error) {
        console.error('Delete error:', error);
        toast.error('Failed to delete file');
        return;
      }
    }
    setMediaFiles(prev => prev.filter(f => f.id !== file.id));
    if (selectedFile?.id === file.id) setSelectedFile(null);
    toast.success('File deleted');
  };

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success('URL copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleMute = (fileId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setVideoMuted(prev => {
      const newMuted = { ...prev, [fileId]: !prev[fileId] };
      if (videoRefs.current[fileId]) videoRefs.current[fileId]!.muted = newMuted[fileId];
      return newMuted;
    });
  };

  const handleVideoHover = (fileId: string) => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredVideo(fileId);
      setTimeout(() => {
        const video = videoRefs.current[fileId];
        if (video) { video.currentTime = 0; video.muted = videoMuted[fileId] ?? true; video.play().catch(() => {}); }
      }, 100);
    }, 300);
  };

  const handleVideoLeave = (fileId: string) => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    const video = videoRefs.current[fileId];
    if (video) { video.pause(); video.currentTime = 0; }
    setHoveredVideo(null);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    if (!cloudName) { 
      toast.error('Cloudinary not configured');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    if (totalStorage + file.size > MAX_STORAGE) { 
      toast.error('Storage limit reached!');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'myapp_upload_sync');

    try {
      const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/upload`;
      console.log('📤 Uploading to Cloudinary...');

      const xhr = new XMLHttpRequest();
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          setUploadProgress(Math.round((event.loaded / event.total) * 100));
        }
      });

      const response: any = await new Promise((resolve, reject) => {
        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try { resolve(JSON.parse(xhr.responseText)); } 
            catch (e) { reject(new Error('Invalid JSON response')); }
          } else { 
            reject(new Error(`HTTP ${xhr.status}`)); 
          }
        });
        xhr.addEventListener('error', () => reject(new Error('Network error')));
        xhr.addEventListener('abort', () => reject(new Error('Upload cancelled')));
        xhr.open('POST', uploadUrl);
        xhr.send(formData);
      });

      console.log('📡 Cloudinary Response:', response);

      if (response.error) {
        throw new Error(response.error.message || 'Cloudinary error');
      }

      let fileUrl = response.secure_url || response.url;
      let publicId = response.public_id;
      let format = response.format || file.name.split('.').pop() || '';

      if (!fileUrl && publicId) {
        const resourceType = response.resource_type || 'image';
        fileUrl = `https://res.cloudinary.com/${cloudName}/${resourceType}/upload/${publicId}.${format}`;
      }

      if (!fileUrl) {
        throw new Error('Could not determine file URL from Cloudinary response');
      }

      console.log('📍 File URL:', fileUrl);

      const originalName = response.original_filename || file.name.replace(/\.[^.]+$/, '') || 'unnamed';
      
      // Determine file type from the actual file extension
      const fileExtension = (format || file.name.split('.').pop() || '').toLowerCase();
      let fileType = 'other';
      
      if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico', 'avif'].includes(fileExtension)) {
        fileType = 'image';
      } else if (['mp4', 'mov', 'webm', 'avi', 'mkv', 'flv', 'wmv', 'm4v'].includes(fileExtension)) {
        fileType = 'video';
      } else if (['mp3', 'wav', 'aac', 'flac', 'ogg', 'm4a', 'wma', 'aiff'].includes(fileExtension)) {
        fileType = 'audio';
      }

      // Also check MIME type as fallback
      if (fileType === 'other' && file.type) {
        if (file.type.startsWith('image/')) fileType = 'image';
        else if (file.type.startsWith('video/')) fileType = 'video';
        else if (file.type.startsWith('audio/')) fileType = 'audio';
      }

      console.log('📋 File type detected:', fileType);

      const { data: dbData, error: dbError } = await supabase
        .from('files')
        .insert({
          user_id: user?.id,
          cloudinary_id: publicId || 'unknown',
          file_name: originalName,
          file_url: fileUrl,
          file_type: fileType,
          file_size: response.bytes || file.size || 0,
          format: format,
        })
        .select()
        .single();

      if (dbError) {
        console.error('❌ Supabase insert error:', dbError);
        toast.error(`Database error: ${dbError.message}`);
        throw new Error(dbError.message);
      }

      console.log('✅ Supabase insert successful:', dbData);

      const newFile: MediaFile = {
        url: fileUrl,
        type: fileType,
        name: originalName,
        id: publicId || '',
        size: response.bytes || file.size || 0,
        date: response.created_at || new Date().toISOString(),
        format: format,
        dbId: dbData?.id || '',
      };

      setMediaFiles(prev => [newFile, ...prev]);
      toast.success('Upload complete!');

    } catch (err: any) {
      console.error('❌ Upload error:', err);
      toast.error(`Upload failed: ${err.message || 'Unknown error'}`);
    } finally {
      setUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const tabs = [
    { id: 'all', label: 'All', icon: FolderOpen },
    { id: 'videos', label: 'Videos', icon: Video },
    { id: 'images', label: 'Images', icon: Image },
    { id: 'audio', label: 'Audio', icon: Music },
  ];

  const fileCounts = {
    all: mediaFiles.length,
    images: mediaFiles.filter(f => f.type === 'image').length,
    videos: mediaFiles.filter(f => f.type === 'video').length,
    audio: mediaFiles.filter(f => f.type === 'audio').length,
  };

  // Video Card with preview - responsive
  const VideoCard = ({ file }: { file: MediaFile }) => {
    const isHovered = hoveredVideo === file.id;
    const duration = videoDuration[file.id] || '0:00';
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
      const checkMobile = () => {
        setIsMobile(window.innerWidth < 768);
      };
      checkMobile();
      window.addEventListener('resize', checkMobile);
      return () => window.removeEventListener('resize', checkMobile);
    }, []);

    useEffect(() => {
      videoRefs.current[file.id] = videoRef.current;
    }, [file.id]);

    const handleMobileClick = () => {
      if (isMobile) {
        const video = videoRefs.current[file.id];
        if (video) {
          if (video.paused) {
            video.muted = videoMuted[file.id] ?? true;
            video.play().catch(() => {});
          } else {
            video.pause();
          }
        }
      }
    };

    return (
      <div 
        className="group cursor-pointer"
        onMouseEnter={() => !isMobile && handleVideoHover(file.id)}
        onMouseLeave={() => !isMobile && handleVideoLeave(file.id)}
        onClick={() => {
          if (isMobile) {
            handleMobileClick();
          } else {
            setSelectedFile(file);
          }
        }}
      >
        <div className="relative rounded-xl overflow-hidden bg-gray-900 aspect-video">
          <video 
            ref={videoRef}
            src={file.url}
            className="w-full h-full object-cover"
            muted={videoMuted[file.id] !== false}
            loop 
            playsInline 
            preload="metadata"
          />

          {!isHovered && duration !== '0:00' && (
            <span className="absolute bottom-2 right-2 sm:bottom-3 sm:right-3 bg-black/90 text-white text-[10px] sm:text-xs px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-md font-medium">
              {duration}
            </span>
          )}

          <div className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ${isHovered ? 'opacity-0 scale-75' : 'opacity-100 scale-100'}`}>
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-black/60 rounded-full flex items-center justify-center group-hover:bg-black/80 group-hover:scale-110 transition-all duration-300">
              <Play className="w-5 h-5 sm:w-7 sm:h-7 text-white ml-0.5 sm:ml-1" fill="white" />
            </div>
          </div>

          <div className={`absolute bottom-0 left-0 right-0 p-2 sm:p-4 bg-gradient-to-t from-black/90 to-transparent transition-all duration-300 ${isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <div className="flex items-center justify-between gap-2 sm:gap-4">
              <button onClick={(e) => { e.stopPropagation(); toggleMute(file.id, e); }} 
                className="p-1.5 sm:p-2 hover:bg-white/20 rounded-full transition-colors">
                {videoMuted[file.id] !== false ? <VolumeX className="w-4 h-4 sm:w-5 sm:h-5 text-white" /> : <Volume2 className="w-4 h-4 sm:w-5 sm:h-5 text-white" />}
              </button>
              <div className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
                <div className="h-full bg-red-500 rounded-full w-1/2 animate-pulse" />
              </div>
              <span className="text-[8px] sm:text-[10px] text-white/90 font-medium">HD</span>
            </div>
          </div>

          <span className="absolute top-2 left-2 sm:top-3 sm:left-3 bg-red-500/90 text-white text-[8px] sm:text-[10px] px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-md font-medium flex items-center gap-0.5 sm:gap-1">
            <Video className="w-2 h-2 sm:w-3 sm:h-3" /> <span className="hidden xs:inline">VIDEO</span>
          </span>

          <button onClick={(e) => { e.stopPropagation(); handleDelete(file, e); }}
            className="absolute top-2 right-2 sm:top-3 sm:right-3 p-1 sm:p-1.5 bg-red-500/90 hover:bg-red-600 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200">
            <Trash2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white" />
          </button>
        </div>

        <div className="mt-2 sm:mt-3">
          <h3 className="text-xs sm:text-sm font-medium text-gray-900 line-clamp-2">{file.name}</h3>
          <div className="flex flex-wrap items-center gap-1 sm:gap-2 mt-1 text-[10px] sm:text-xs text-gray-500">
            <span className="font-medium">{formatFileSize(file.size)}</span>
            <span className="w-0.5 h-0.5 bg-gray-300 rounded-full" />
            <span>{file.date ? new Date(file.date).toLocaleDateString() : 'Unknown'}</span>
            {duration !== '0:00' && <><span className="w-0.5 h-0.5 bg-gray-300 rounded-full" /><span className="flex items-center gap-0.5"><Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> {duration}</span></>}
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-1.5 sm:mt-2">
            <button onClick={(e) => { e.stopPropagation(); handleDownload(file.url, file.name); }} 
              className="text-[10px] sm:text-xs text-gray-600 hover:text-black transition-colors flex items-center gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-lg hover:bg-gray-100">
              <Download className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> <span className="hidden xs:inline">Download</span>
            </button>
            <button onClick={(e) => { e.stopPropagation(); handleCopyUrl(file.url); }} 
              className="text-[10px] sm:text-xs text-gray-600 hover:text-black transition-colors flex items-center gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-lg hover:bg-gray-100">
              <Share2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> <span className="hidden xs:inline">Share</span>
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Image Card Component
  const ImageCard = ({ file }: { file: MediaFile }) => {
    return (
      <div className="group cursor-pointer" onClick={() => setSelectedFile(file)}>
        <div className={`relative rounded-xl overflow-hidden bg-gray-100 ${viewMode === 'grid' ? 'aspect-video' : 'aspect-video max-w-2xl mx-auto'}`}>
          <img 
            src={file.url} 
            alt={file.name} 
            className="w-full h-full object-cover"
            loading="lazy"
          />
          <span className="absolute top-1 left-1 sm:top-2 sm:left-2 bg-black/80 backdrop-blur-sm p-1 sm:p-1.5 rounded-lg">
            <Image className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" />
          </span>
          <button onClick={(e) => handleDelete(file, e)} 
            className="absolute top-1 right-1 sm:top-2 sm:right-2 p-1 sm:p-1.5 bg-red-500/90 hover:bg-red-600 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
            <Trash2 className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 text-white" />
          </button>
        </div>
        <div className={`mt-1.5 sm:mt-3 ${viewMode === 'list' ? 'max-w-2xl mx-auto w-full' : ''}`}>
          <h3 className="text-xs sm:text-sm font-medium text-gray-900 line-clamp-2">{file.name}</h3>
          <div className="flex flex-wrap items-center gap-1 sm:gap-2 mt-0.5 sm:mt-1 text-[10px] sm:text-xs text-gray-500">
            <span className="font-medium">{formatFileSize(file.size)}</span>
            <span className="w-0.5 h-0.5 bg-gray-300 rounded-full" />
            <span>{file.date ? new Date(file.date).toLocaleDateString() : 'Unknown'}</span>
          </div>
        </div>
      </div>
    );
  };

  // Audio Card Component
  const AudioCard = ({ file }: { file: MediaFile }) => {
    return (
      <div className="group cursor-pointer" onClick={() => setSelectedFile(file)}>
        <div className={`relative rounded-xl overflow-hidden bg-purple-50 ${viewMode === 'grid' ? 'aspect-video' : 'aspect-video max-w-2xl mx-auto'}`}>
          <div className="w-full h-full flex flex-col items-center justify-center">
            <Music className="w-8 h-8 sm:w-12 sm:h-12 text-purple-400" />
            <span className="text-[10px] sm:text-xs text-gray-500 mt-1 sm:mt-2 font-medium">AUDIO</span>
          </div>
          <span className="absolute top-1 left-1 sm:top-2 sm:left-2 bg-black/80 backdrop-blur-sm p-1 sm:p-1.5 rounded-lg">
            <Music className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" />
          </span>
          <button onClick={(e) => handleDelete(file, e)} 
            className="absolute top-1 right-1 sm:top-2 sm:right-2 p-1 sm:p-1.5 bg-red-500/90 hover:bg-red-600 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
            <Trash2 className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 text-white" />
          </button>
        </div>
        <div className={`mt-1.5 sm:mt-3 ${viewMode === 'list' ? 'max-w-2xl mx-auto w-full' : ''}`}>
          <h3 className="text-xs sm:text-sm font-medium text-gray-900 line-clamp-2">{file.name}</h3>
          <div className="flex flex-wrap items-center gap-1 sm:gap-2 mt-0.5 sm:mt-1 text-[10px] sm:text-xs text-gray-500">
            <span className="font-medium">{formatFileSize(file.size)}</span>
            <span className="w-0.5 h-0.5 bg-gray-300 rounded-full" />
            <span>{file.date ? new Date(file.date).toLocaleDateString() : 'Unknown'}</span>
          </div>
        </div>
      </div>
    );
  };

  if (loadingFiles) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar onUpload={handleUpload} uploading={uploading} searchQuery={searchQuery} onSearchChange={setSearchQuery} viewMode={viewMode} onViewModeChange={setViewMode} />
        <div className="flex items-center justify-center py-20 sm:py-40 px-4">
          <LoadingScreen text="Loading your media" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar onUpload={handleUpload} uploading={uploading} searchQuery={searchQuery} onSearchChange={setSearchQuery} viewMode={viewMode} onViewModeChange={setViewMode} />
      <div className="flex-1 max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 gap-2 sm:gap-0">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-black">My Media</h1>
            <p className="text-xs sm:text-sm text-gray-500">Manage your images, videos, and audio files</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-500">
            <span>{mediaFiles.length} files</span>
            <span className="w-0.5 h-0.5 bg-gray-300 rounded-full" />
            <span>{formatFileSize(totalStorage)} used</span>
          </div>
        </div>

        <div className="mb-4 sm:mb-6 bg-gray-50 rounded-xl p-2 sm:p-3 border border-gray-100">
          <div className="flex items-center justify-between mb-1 sm:mb-1.5">
            <span className="text-[10px] sm:text-xs text-gray-500">Storage</span>
            <span className="text-[10px] sm:text-xs font-medium text-gray-700">{formatFileSize(totalStorage)} / {formatFileSize(MAX_STORAGE)}</span>
          </div>
          <div className="w-full h-1 sm:h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all ${storagePercent > 80 ? 'bg-red-500' : 'bg-black'}`} style={{ width: `${Math.min(storagePercent, 100)}%` }} />
          </div>
        </div>

        <div className="flex items-center gap-0.5 sm:gap-1 mb-4 sm:mb-6 overflow-x-auto pb-1">
          {tabs.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-1 sm:gap-2 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-full text-[10px] sm:text-sm font-medium transition-all whitespace-nowrap ${
                activeTab === tab.id ? 'bg-black text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}>
              <tab.icon className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden xs:inline">{tab.label}</span>
              <span className="text-[8px] sm:text-xs px-1 sm:px-1.5 py-0.5 rounded-full bg-white/20 text-white">
                {fileCounts[tab.id as keyof typeof fileCounts]}
              </span>
            </button>
          ))}
        </div>

        <div className="mb-6 sm:mb-8">
          {uploading ? (
            <div className="bg-gray-50 rounded-2xl p-6 sm:p-8 text-center border-2 border-dashed border-gray-200">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400 animate-spin" />
              </div>
              <h2 className="text-base sm:text-lg font-semibold text-gray-700 mb-2">Uploading...</h2>
              <div className="max-w-xs sm:max-w-md mx-auto">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs sm:text-sm text-gray-500">Progress</span>
                  <span className="text-xs sm:text-sm font-semibold text-gray-800">{uploadProgress}%</span>
                </div>
                <div className="w-full h-2 sm:h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-black rounded-full transition-all duration-300 ease-out" style={{ width: `${uploadProgress}%` }} />
                </div>
              </div>
            </div>
          ) : activeTab === 'all' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {[{ icon: Image, label: 'Images', desc: 'JPG, PNG, GIF, WebP', accept: 'image/*', key: 'upload-images' },
                { icon: Video, label: 'Videos', desc: 'MP4, MOV, WebM', accept: 'video/*', key: 'upload-videos' },
                { icon: Music, label: 'Audio', desc: 'MP3, WAV, AAC', accept: 'audio/*', key: 'upload-audio' }
              ].map((item) => (
                <label key={item.key} className="cursor-pointer block">
                  <div className="bg-gray-50 rounded-2xl p-4 sm:p-5 text-center border-2 border-dashed border-gray-200 hover:border-black hover:bg-gray-100 transition-all group h-full">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-2 sm:mb-3 group-hover:bg-black transition-colors">
                      <item.icon className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400 group-hover:text-white transition-colors" />
                    </div>
                    <h3 className="font-semibold text-gray-700 mb-0.5 sm:mb-1 text-sm sm:text-base">{item.label}</h3>
                    <p className="text-gray-400 text-[10px] sm:text-xs mb-2 sm:mb-3">{item.desc}</p>
                    <span className="inline-block bg-black text-white text-xs sm:text-sm font-medium px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl">Upload {item.label}</span>
                    <input type="file" className="hidden" onChange={handleUpload} accept={item.accept} disabled={uploading} />
                  </div>
                </label>
              ))}
            </div>
          ) : (
            <label className="cursor-pointer block">
              <div className="bg-gray-50 rounded-2xl p-6 sm:p-8 text-center border-2 border-dashed border-gray-200 hover:border-black hover:bg-gray-100 transition-all group">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4 group-hover:bg-black transition-colors">
                  {activeTab === 'images' ? <Image className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400 group-hover:text-white transition-colors" /> :
                   activeTab === 'videos' ? <Video className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400 group-hover:text-white transition-colors" /> :
                   <Music className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400 group-hover:text-white transition-colors" />}
                </div>
                <h2 className="text-base sm:text-lg font-semibold text-gray-700 mb-1 sm:mb-2">Upload {activeTab}</h2>
                <p className="text-xs sm:text-sm text-gray-400">{activeTab === 'images' ? 'JPG, PNG, GIF, WebP, SVG' : activeTab === 'videos' ? 'MP4, MOV, WebM, AVI' : 'MP3, WAV, AAC, FLAC'}</p>
                <input ref={fileInputRef} type="file" className="hidden" onChange={handleUpload} accept={activeTab === 'images' ? 'image/*' : activeTab === 'videos' ? 'video/*' : 'audio/*'} disabled={uploading} />
              </div>
            </label>
          )}
        </div>

        {filteredFiles.length > 0 ? (
          <div>
            <div className="flex flex-wrap items-center justify-between mb-3 sm:mb-4 gap-2">
              <h2 className="text-base sm:text-lg font-semibold text-black">{searchQuery ? `Results for "${searchQuery}"` : 'All Media'}</h2>
              <span className="text-xs sm:text-sm text-gray-400">{filteredFiles.length} files</span>
            </div>
            <div className={`grid gap-2 sm:gap-3 md:gap-4 ${
              viewMode === 'grid' 
                ? 'grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4' 
                : 'grid-cols-1'
            }`}>
              {filteredFiles.map((file) => {
                if (file.type === 'video') {
                  return <VideoCard key={file.id || file.dbId} file={file} />;
                } else if (file.type === 'image') {
                  return <ImageCard key={file.id || file.dbId} file={file} />;
                } else if (file.type === 'audio') {
                  return <AudioCard key={file.id || file.dbId} file={file} />;
                }
                return null;
              })}
            </div>
          </div>
        ) : (
          <div className="text-center py-12 sm:py-16">
            <FolderOpen className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-3 sm:mb-4" />
            <h3 className="text-base sm:text-lg font-semibold text-gray-500 mb-1 sm:mb-2">Your library is empty</h3>
            <p className="text-xs sm:text-sm text-gray-400">Upload your first image, video, or audio file</p>
          </div>
        )}
      </div>

      <footer className="border-t border-gray-100 mt-6 sm:mt-8">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-3 sm:py-4 flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-0">
          <p className="text-[10px] sm:text-xs text-gray-400 text-center sm:text-left">Created by <span className="font-medium text-gray-600">Kafiswe Chimputu Jr</span></p>
          <p className="text-[10px] sm:text-xs text-gray-400">© {new Date().getFullYear()} MediaStore</p>
        </div>
      </footer>

      {selectedFile && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-2 sm:p-4" onClick={() => setSelectedFile(null)}>
          <div className="max-w-5xl w-full max-h-[95vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-2 sm:mb-3 flex-shrink-0">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0">{getFileIcon(selectedFile)}</div>
                <div className="min-w-0">
                  <span className="text-xs sm:text-sm text-white truncate max-w-[150px] sm:max-w-md block">{selectedFile.name}</span>
                  <span className="text-[10px] sm:text-xs text-gray-400">{formatFileSize(selectedFile.size)}</span>
                </div>
              </div>
              <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                <button onClick={() => handleCopyUrl(selectedFile.url)} className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 bg-white/10 hover:bg-white/20 rounded-xl text-xs sm:text-sm text-white">
                  {copied ? <><Check className="w-3 h-3 sm:w-4 sm:h-4 text-green-400" /><span className="text-green-400 text-[10px] sm:text-xs hidden xs:inline">Copied!</span></> : <><Copy className="w-3 h-3 sm:w-4 sm:h-4" /><span className="hidden sm:block text-xs">Copy</span></>}
                </button>
                <button onClick={() => handleDownload(selectedFile.url, selectedFile.name)} className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 bg-white hover:bg-gray-200 rounded-xl text-xs sm:text-sm font-medium text-black">
                  <Download className="w-3 h-3 sm:w-4 sm:h-4" /><span className="hidden sm:block">Download</span>
                </button>
                <button onClick={() => setSelectedFile(null)} className="p-1.5 sm:p-2 hover:bg-white/10 rounded-xl text-white"><X className="w-4 h-4 sm:w-5 sm:h-5" /></button>
              </div>
            </div>
            <div className="flex-1 rounded-2xl overflow-hidden bg-black flex items-center justify-center min-h-0">
              {selectedFile.type === 'image' ? (
                <img src={selectedFile.url} alt={selectedFile.name} className="w-full max-h-[70vh] sm:max-h-[80vh] object-contain" />
              ) : selectedFile.type === 'video' ? (
                <video controls autoPlay className="w-full max-h-[70vh] sm:max-h-[80vh]"><source src={selectedFile.url} /></video>
              ) : (
                <div className="flex flex-col items-center justify-center p-6 sm:p-12 text-white w-full">
                  <div className="w-20 h-20 sm:w-28 sm:h-28 bg-purple-500/20 rounded-3xl flex items-center justify-center mb-4 sm:mb-6">
                    <Music className="w-10 h-10 sm:w-14 sm:h-14 text-purple-400" />
                  </div>
                  <h2 className="text-base sm:text-xl font-semibold mb-1 text-center px-4">{selectedFile.name}</h2>
                  <div className="flex items-center gap-2 sm:gap-4 mb-4 sm:mb-8 text-gray-400 text-xs sm:text-sm">
                    <span className="uppercase bg-white/10 px-1.5 sm:px-2 py-0.5 rounded-md">Audio</span>
                    <span className="w-0.5 h-0.5 bg-gray-600 rounded-full" />
                    <span>{formatFileSize(selectedFile.size)}</span>
                  </div>
                  <audio controls className="w-full max-w-xs sm:max-w-md mb-4 sm:mb-8"><source src={selectedFile.url} /></audio>
                  <div className="flex gap-2 sm:gap-3 w-full max-w-xs sm:max-w-sm">
                    <button onClick={() => handleDownload(selectedFile.url, selectedFile.name)} className="flex-1 flex items-center justify-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 sm:py-3 bg-white hover:bg-gray-200 rounded-xl font-medium text-black text-xs sm:text-sm"><Download className="w-3 h-3 sm:w-4 sm:h-4" /> Download</button>
                    <button onClick={() => window.open(selectedFile.url, '_blank')} className="flex-1 flex items-center justify-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 sm:py-3 bg-white/10 hover:bg-white/20 rounded-xl text-white text-xs sm:text-sm border border-white/20"><ExternalLink className="w-3 h-3 sm:w-4 sm:h-4" /> Open</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}