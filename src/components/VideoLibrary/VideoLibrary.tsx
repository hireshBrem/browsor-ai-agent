'use client';

import { useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button2';

interface VideoFile {
  id: string;
  file: File;
  name: string;
  size: number;
  duration?: number;
  thumbnail?: string;
  uploadedAt: Date;
}

interface VideoLibraryProps {
  onVideoSelect: (file: File) => void;
  selectedVideoId?: string;
}

export default function VideoLibrary({ onVideoSelect, selectedVideoId }: VideoLibraryProps) {
  const [videos, setVideos] = useState<VideoFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Create blob URLs for videos
  const videoUrls = useMemo(() => {
    const urls: Record<string, string> = {};
    videos.forEach(video => {
      urls[video.id] = URL.createObjectURL(video.file);
    });
    return urls;
  }, [videos]);

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    setIsUploading(true);
    
    try {
      const newVideos: VideoFile[] = [];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Validate file type
        if (!file.type.startsWith('video/')) {
          console.warn(`Skipping non-video file: ${file.name}`);
          continue;
        }
        
        // Validate file size (100MB limit)
        if (file.size > 100 * 1024 * 1024) {
          console.warn(`File too large: ${file.name}`);
          continue;
        }
        
        const videoFile: VideoFile = {
          id: `video-${Date.now()}-${i}`,
          file,
          name: file.name,
          size: file.size,
          uploadedAt: new Date(),
        };
        
        newVideos.push(videoFile);
      }
      
      setVideos(prev => [...prev, ...newVideos]);
    } catch (error) {
      console.error('Error uploading files:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFileUpload(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleVideoSelect = (video: VideoFile) => {
    onVideoSelect(video.file);
  };

  const handleDeleteVideo = (videoId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Revoke the blob URL to free memory
    if (videoUrls[videoId]) {
      URL.revokeObjectURL(videoUrls[videoId]);
    }
    
    setVideos(prev => prev.filter(v => v.id !== videoId));
  };

  const formatFileSize = (bytes: number) => {
    return (bytes / 1024 / 1024).toFixed(2);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-500/10 rounded-lg">
            <Icon type="sheet" size="sm" className="text-purple-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Video Library</h3>
            <p className="text-sm text-gray-400">Manage your screen recordings</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">{videos.length} videos</span>
        </div>
      </div>

      {/* Video Grid with Upload Area */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Upload Area - Same size as video cards */}
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          className={`
            relative border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200 overflow-hidden
            ${dragOver 
              ? 'border-purple-400 bg-purple-500/5' 
              : 'border-gray-600 hover:border-gray-500 bg-gray-800/20'
            }
          `}
        >
          {/* Upload content with same aspect ratio as videos */}
          <div className="aspect-video flex flex-col items-center justify-center">
            <div className={`p-3 rounded-full mb-3 ${dragOver ? 'bg-purple-500/20' : 'bg-gray-700'}`}>
              <Icon type="upload" size="md" className={dragOver ? 'text-purple-400' : 'text-gray-400'} />
            </div>
            <div className="text-center">
              <p className="text-white font-medium text-sm mb-1">
                {dragOver ? 'Drop videos here' : 'Add Videos'}
              </p>
              <p className="text-xs text-gray-400">
                Click or drag & drop
              </p>
            </div>
          </div>
          
          {/* Upload progress indicator */}
          {isUploading && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <div className="flex flex-col items-center gap-2">
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span className="text-white text-sm">Uploading...</span>
              </div>
            </div>
          )}
          
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*,.mp4,.mov,.avi,.mkv,.webm"
            multiple
            onChange={(e) => handleFileUpload(e.target.files)}
            className="hidden"
          />
        </div>

        {/* Video Cards */}
        {videos.length > 0 && (
          <AnimatePresence>
            {videos.map((video) => (
              <motion.div
                key={video.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
                onClick={() => handleVideoSelect(video)}
                className={`
                  relative group cursor-pointer rounded-xl overflow-hidden border-2 transition-all duration-200
                  ${selectedVideoId === video.id 
                    ? 'border-purple-500 bg-purple-500/10' 
                    : 'border-gray-600 hover:border-gray-500 bg-gray-800/50'
                  }
                `}
              >
                {/* Video Preview */}
                <div className="aspect-video bg-black relative">
                  <video
                    src={videoUrls[video.id]}
                    className="w-full h-full object-cover"
                    muted
                    preload="metadata"
                  />
                  
                  {/* Play overlay */}
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="p-3 bg-white/20 rounded-full backdrop-blur-sm">
                      <Icon type="play" size="md" className="text-white" />
                    </div>
                  </div>
                  
                  {/* Selection indicator */}
                  {selectedVideoId === video.id && (
                    <div className="absolute top-2 right-2 p-1 bg-purple-500 rounded-full">
                      <Icon type="check" size="sm" className="text-white" />
                    </div>
                  )}
                  
                  {/* Delete button */}
                  <button
                    onClick={(e) => handleDeleteVideo(video.id, e)}
                    className="absolute top-2 left-2 p-1.5 bg-red-500/80 hover:bg-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Icon type="trash" size="sm" className="text-white" />
                  </button>
                </div>
                
                {/* Video Info */}
                <div className="p-3">
                  <h4 className="text-white font-medium text-sm truncate mb-1">
                    {video.name}
                  </h4>
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>{formatFileSize(video.size)} MB</span>
                    <span>{formatDate(video.uploadedAt)}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
