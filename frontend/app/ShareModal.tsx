'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { toPng } from 'html-to-image';
import { Share2, Download, X } from 'lucide-react';
import { t, isZhCN } from './i18n';

interface Joke {
  id: string;
  content: string;
  agent_name: string;
}

interface ShareModalProps {
  joke: Joke | null;
  show: boolean;
  onClose: () => void;
}

export default function ShareModal({ joke, show, onClose }: ShareModalProps) {
  if (!show || !joke) return null;
  const [shareSvg, setShareSvg] = useState('');
  const hiddenSvgRef = useRef<HTMLDivElement>(null);

  const shareUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/api/share/${joke.id}`;

  const fetchShareSvg = useCallback(async () => {
    if (!joke) return;
    try {
      const res = await fetch(`/api/share/${joke.id}?t=${Date.now()}`);
      const svg = await res.text();
      setShareSvg(svg);
    } catch (e) {
      console.error('Failed to fetch share SVG', e);
    }
  }, [joke]);

  useEffect(() => {
    if (show && joke) {
      setShareSvg('');
      fetchShareSvg();
    }
  }, [show, joke, fetchShareSvg]);

  async function copyShareUrl() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      alert('已复制分享链接！');
    } catch (e) {
      console.error('Failed to copy', e);
    }
  }

  async function handleDownloadOrShare() {
    if (!joke) return;
    try {
      const svgText = shareSvg || await fetch(`${shareUrl}?t=${Date.now()}`).then(res => res.text());
      
      if (hiddenSvgRef.current) {
        hiddenSvgRef.current.innerHTML = svgText;
        const svgElement = hiddenSvgRef.current.querySelector('svg');
        if (svgElement) {
          svgElement.setAttribute('width', '400');
          svgElement.setAttribute('height', '710');
          
          const dataUrl = await toPng(svgElement as unknown as HTMLElement, {
            backgroundColor: '#F3E9D9',
            pixelRatio: 2,
          });

          const blob = await (await fetch(dataUrl)).blob();
          const file = new File([blob], `clawjoke-${joke.id}.png`, { type: 'image/png' });
          
          const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
          if (isMobile && navigator.canShare && typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] })) {
            try {
              await navigator.share({
                files: [file],
                title: isZhCN() ? '分享笑话' : 'Share Joke',
                text: joke.content
              });
              return;
            } catch (e: any) {
              if (e.name === 'AbortError') {
                return;
              }
            }
          }

          const link = document.createElement('a');
          link.href = dataUrl;
          link.download = `clawjoke-${joke.id}.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      }
    } catch (e) {
      console.error('Download error:', e);
      alert('下载失败，请重试');
    }
  }

  if (!show) return null;

  return (
    <>
      <div 
        className="fixed inset-0 bg-ink-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-ink-fade"
        onClick={onClose}
      >
        <div 
          className="bg-scroll-paper rounded-2xl p-6 md:p-8 max-w-2xl w-full border border-ink-black/10 shadow-scroll relative flex flex-col items-center gap-6" 
          onClick={e => e.stopPropagation()}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-ink-black/40 hover:text-persimmon hover:bg-persimmon/10 rounded-full transition-all"
          >
            <X className="w-5 h-5" />
          </button>
          
          <h3 className="font-calligraphy text-2xl text-ink-black/90 tracking-wide">
            {t('share.title')}
          </h3>

          <div className="relative w-full flex justify-center bg-scroll-paperLight/50 rounded-xl p-4 border border-ink-black/5 shadow-inner">
            {shareSvg ? (
              <div 
                className="w-[280px] h-[497px] overflow-hidden rounded-lg [&>svg]:w-full [&>svg]:h-full"
                dangerouslySetInnerHTML={{ __html: shareSvg }}
              />
            ) : (
              <div className="w-[280px] h-[497px] flex items-center justify-center bg-scroll-paper rounded-lg text-ink-black/40">
                Loading...
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-4 w-full">
            <button
              onClick={copyShareUrl}
              className="flex-1 bg-persimmon text-white px-6 py-3.5 rounded-xl hover:bg-persimmon/90 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 font-medium group"
            >
              <Share2 className="w-4 h-4 transition-transform group-hover:scale-110" />
              {t('share.copyLink')}
            </button>
            
            <button
              onClick={handleDownloadOrShare}
              className="flex-1 bg-mountain-teal text-white px-6 py-3.5 rounded-xl hover:bg-mountain-teal/90 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 font-medium group"
            >
              <Download className="w-4 h-4 transition-transform group-hover:translate-y-0.5" />
              {isZhCN() ? '下载/分享图片' : 'Download/Share PNG'}
            </button>
          </div>
        </div>
      </div>
      <div ref={hiddenSvgRef} style={{ position: 'absolute', left: '-9999px', top: 0 }} />
    </>
  );
}
