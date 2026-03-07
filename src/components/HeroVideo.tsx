import { useState, useEffect, useRef, useCallback } from 'react';
import { useStore } from '@/hooks/useStore';
import heroVideoData from '@/data/heroVideos.json';

export function HeroVideo() {
    const { carouselVideos, dataLoaded } = useStore();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [videos, setVideos] = useState<string[]>(Object.values(heroVideoData));
    const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
    // Track which videos have been preloaded
    const [loadedIndices, setLoadedIndices] = useState<Set<number>>(new Set([0]));

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
            // Reset loaded indices when videos change
            setLoadedIndices(new Set([0]));
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
        if (currentVideo) {
            currentVideo.currentTime = 0;
            currentVideo.play().catch(() => {});
        }

        videoRefs.current.forEach((video, index) => {
            if (index !== currentIndex && video) {
                video.pause();
                video.currentTime = 0;
            }
        });
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
                    src={src}
                    className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${index === currentIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
                    muted
                    playsInline
                    preload={index === 0 ? 'auto' : 'none'}
                    onEnded={index === currentIndex ? handleVideoEnded : undefined}
                    onTimeUpdate={index === currentIndex ? handleTimeUpdate : undefined}
                />
            ))}
            <div className="absolute inset-0 bg-black/40 z-20" />
        </div>
    );
}
