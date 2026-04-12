import { useState, useEffect, useRef, useCallback } from 'react';
import { useStore } from '@/hooks/useStore';
import heroVideoData from '@/data/heroVideos.json';

// Detect MIME type from URL for proper <source type> attribute
function getMimeType(url: string): string {
    const lower = url.toLowerCase().split('?')[0];
    if (lower.endsWith('.webm')) return 'video/webm';
    if (lower.endsWith('.mov')) return 'video/quicktime';
    if (lower.endsWith('.ogg') || lower.endsWith('.ogv')) return 'video/ogg';
    return 'video/mp4'; // default / most compatible
}

export function HeroVideo() {
    const { carouselVideos, dataLoaded } = useStore();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [videos, setVideos] = useState<string[]>(Object.values(heroVideoData));
    const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
    const [loadedIndices, setLoadedIndices] = useState<Set<number>>(new Set([0]));
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        if (dataLoaded) {
            const activeVideos = carouselVideos
                .filter(v => v.isActive)
                .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
                .map(v => v.url);

            if (activeVideos.length > 0) {
                setVideos(activeVideos);
            } else {
                setVideos(Object.values(heroVideoData));
            }
            setLoadedIndices(new Set([0]));
            setIsReady(false);
        }
    }, [carouselVideos, dataLoaded]);

    // Preload the next video when the current one is halfway through
    const handleTimeUpdate = useCallback((e: React.SyntheticEvent<HTMLVideoElement>) => {
        const video = e.currentTarget;
        if (video.duration && video.currentTime > video.duration * 0.5) {
            const nextIndex = (currentIndex + 1) % videos.length;
            if (!loadedIndices.has(nextIndex)) {
                setLoadedIndices(prev => new Set([...prev, nextIndex]));
                const nextVideo = videoRefs.current[nextIndex];
                if (nextVideo) {
                    nextVideo.preload = 'auto';
                    nextVideo.load();
                }
            }
        }
    }, [currentIndex, videos.length, loadedIndices]);

    useEffect(() => {
        const currentVideo = videoRefs.current[currentIndex];
        if (!currentVideo) return;

        const attemptPlay = () => {
            setIsReady(true);
            currentVideo.play().catch(() => {});
        };

        currentVideo.currentTime = 0;

        if (currentVideo.readyState >= 3) {
            attemptPlay();
        } else {
            currentVideo.addEventListener('canplay', attemptPlay, { once: true });
        }

        videoRefs.current.forEach((video, index) => {
            if (index !== currentIndex && video) {
                video.pause();
                video.currentTime = 0;
            }
        });

        return () => {
            currentVideo.removeEventListener('canplay', attemptPlay);
        };
    }, [currentIndex, videos]);

    const handleVideoEnded = () => {
        setCurrentIndex((prev) => (prev + 1) % videos.length);
    };

    return (
        <div className="absolute inset-0 w-full h-full overflow-hidden bg-black">
            {videos.map((src, index) => (
                <video
                    key={`${src}-${index}`}
                    ref={(el) => { videoRefs.current[index] = el; }}
                    className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
                        index === currentIndex && isReady ? 'opacity-100 z-10' : 'opacity-0 z-0'
                    }`}
                    muted
                    playsInline
                    preload={index === 0 ? 'auto' : 'none'}
                    onEnded={index === currentIndex ? handleVideoEnded : undefined}
                    onTimeUpdate={index === currentIndex ? handleTimeUpdate : undefined}
                    onCanPlay={index === currentIndex ? () => setIsReady(true) : undefined}
                >
                    <source src={src} type={getMimeType(src)} />
                    {/* Fallback source without type for maximum compatibility */}
                    <source src={src} />
                </video>
            ))}
            <div className="absolute inset-0 bg-black/40 z-20" />
        </div>
    );
}
