/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Menu, Search, X, User, Upload, Save, RefreshCw } from 'lucide-react';

// --- Assets ---
const screenshot1 = '/images/screenshot1.jpg';
const screenshot2 = '/images/screenshot2.jpg';
const delpiero = '/images/delpiero.jpg';
const therock = '/images/therock.jpg';
const leonardo = '/images/LeonardoDiCaprio.jpg';

// --- FILM Assets ---
const screenshot1Film = '/images/Screenshot1FILM.jpg';
const screenshot2Film = '/images/Screenshot2FILM.jpg';
const immagine1Film = '/images/Immagine1FILM.jpg';
const immagine2Film = '/images/Immagine2FILM.jpg';
const immagine3Film = '/images/Immagine3FILM.jpg';

// --- Types ---
interface Preset {
  id: string;
  name: string;
  forceImageName: string;
  searchText: string;
  defaultImages: {
    image1: string;
    image2: string;
    expandedImage1: string;
    expandedImage2: string;
    expandedImage3: string;
  };
}

interface AppSettings {
  activePresetId: string;
  searchText: string;
}

const PRESETS: Record<string, Preset> = {
  default: {
    id: 'default',
    name: 'Pagina predefinita',
    forceImageName: 'Leonardo Di Caprio',
    searchText: 'persone famose',
    defaultImages: {
      image1: screenshot1,
      image2: screenshot2,
      expandedImage1: delpiero,
      expandedImage2: therock,
      expandedImage3: leonardo,
    }
  },
  film: {
    id: 'film',
    name: 'Preset 1 FILM',
    forceImageName: 'NAPOLEON',
    searchText: 'locandine film',
    defaultImages: {
      image1: screenshot1Film,
      image2: screenshot2Film,
      expandedImage1: immagine1Film,
      expandedImage2: immagine2Film,
      expandedImage3: immagine3Film,
    }
  }
};

const DEFAULT_SETTINGS: AppSettings = {
  activePresetId: 'default',
  searchText: PRESETS.default.searchText,
};

// --- Components ---

export default function App() {
  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('google_sim_settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          ...DEFAULT_SETTINGS,
          activePresetId: parsed.activePresetId || 'default',
          searchText: PRESETS[parsed.activePresetId || 'default'].searchText,
        };
      } catch (e) {
        return DEFAULT_SETTINGS;
      }
    }
    return DEFAULT_SETTINGS;
  });

  // Derived images based on active preset
  const currentPreset = PRESETS[settings.activePresetId];
  const currentImages = currentPreset.defaultImages;

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [hasLoadedSecond, setHasLoadedSecond] = useState(false);
  const [editingPresetId, setEditingPresetId] = useState<string | null>(null);
  const [clickCount, setClickCount] = useState(0);
  const [expandedImage, setExpandedImage] = useState<1 | 2 | 3 | null>(null);
  const loadingRef = useRef<HTMLDivElement>(null);

  // --- Preloading Logic ---
  const preloadImages = (imageUrls: (string | null)[]) => {
    imageUrls.forEach(url => {
      if (url && !url.startsWith('data:')) {
        const img = new Image();
        img.src = url;
      }
    });
  };

  // Preload Default Preset on Mount
  useEffect(() => {
    const defaultImages = Object.values(PRESETS.default.defaultImages);
    preloadImages(defaultImages);
  }, []);

  // Preload Film Preset when activated
  useEffect(() => {
    if (settings.activePresetId === 'film') {
      const filmImages = Object.values(PRESETS.film.defaultImages);
      preloadImages(filmImages);
    }
  }, [settings.activePresetId]);

  // Persistence - Sync settings to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('google_sim_settings', JSON.stringify(settings));
    } catch (error) {
      console.error('Errore nel salvataggio delle impostazioni:', error);
      // If localStorage is full, we might want to alert the user or handle it
    }
  }, [settings]);

  // Scroll Pause Logic
  useEffect(() => {
    if (isMenuOpen || expandedImage) return;

    const handleScroll = () => {
      if (hasLoadedSecond) {
        if (loadingRef.current) {
          const rect = loadingRef.current.getBoundingClientRect();
          if (rect.top > window.innerHeight) {
            setHasLoadedSecond(false);
          }
        }
        return;
      }

      if (isPaused) return;

      if (loadingRef.current) {
        const rect = loadingRef.current.getBoundingClientRect();
        if (rect.top <= window.innerHeight && rect.top > 0) {
          setIsPaused(true);
          document.body.style.overflow = 'hidden';
          
          window.scrollTo({
            top: window.scrollY + rect.top - window.innerHeight + 1,
            behavior: 'auto'
          });

          setTimeout(() => {
            setIsPaused(false);
            setHasLoadedSecond(true);
            document.body.style.overflow = 'auto';
          }, 1000);
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: false });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isPaused, hasLoadedSecond, isMenuOpen, expandedImage]);

  const handleGlobalClick = (e: React.MouseEvent) => {
    if (isMenuOpen || expandedImage) return;

    // Exclude clicks on the user icon to avoid interfering with double-click
    const target = e.target as HTMLElement;
    if (target.closest('.user-icon-trigger')) return;

    // ONLY allow clicks on the screenshots (main content area)
    if (!target.closest('[data-screenshot-area="true"]')) return;

    const nextCount = clickCount + 1;
    setClickCount(nextCount);

    if (nextCount === 1) {
      if (currentImages.expandedImage1) setExpandedImage(1);
    } else if (nextCount === 2) {
      if (currentImages.expandedImage2) setExpandedImage(2);
    } else if (nextCount === 3) {
      if (currentImages.expandedImage3) setExpandedImage(3);
    }
  };

  const handlePersonDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMenuOpen(true);
    document.body.style.overflow = 'auto';
  };

  const handleExpandedClick = (e: React.MouseEvent) => {
    const clickY = e.clientY;
    const threshold = window.innerHeight / 10; // Top 10%
    if (clickY < threshold) {
      if (expandedImage === 3) {
        // Redirect to Google Images search
        const query = encodeURIComponent(settings.searchText);
        window.location.href = `https://www.google.com/search?q=${query}&tbm=isch`;
      } else {
        setExpandedImage(null);
      }
    }
  };

  const handleAiModeDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newPresetId = settings.activePresetId === 'default' ? 'film' : 'default';
    const preset = PRESETS[newPresetId];
    
    const newSettings = {
      activePresetId: newPresetId,
      searchText: preset.searchText,
    };
    
    setSettings(newSettings);
    setHasLoadedSecond(false);
    setClickCount(0);
    setExpandedImage(null);
    window.scrollTo(0, 0);
  };

  return (
    <div className="min-h-screen flex flex-col font-sans select-none bg-white">
      <AnimatePresence mode="wait">
        {!isMenuOpen ? (
          <motion.div
            key="main-app"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleGlobalClick}
            className="flex flex-col w-full"
          >
            {/* --- Header - Now relative to scroll with content --- */}
            <header className="bg-white w-full">
              <div className="px-4 pt-4 pb-2">
                <div className="flex items-center justify-between mb-4">
                  <Menu className="text-gray-500 w-6 h-6" />
                  <div className="flex items-center">
                    <span className="text-[#4285F4] font-bold text-2xl">G</span>
                    <span className="text-[#EA4335] font-bold text-2xl">o</span>
                    <span className="text-[#FBBC05] font-bold text-2xl">o</span>
                    <span className="text-[#4285F4] font-bold text-2xl">g</span>
                    <span className="text-[#34A853] font-bold text-2xl">l</span>
                    <span className="text-[#EA4335] font-bold text-2xl">e</span>
                  </div>
                  <div 
                    onDoubleClick={handlePersonDoubleClick}
                    className="user-icon-trigger w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center cursor-pointer active:bg-gray-300 transition-colors"
                  >
                    <User className="text-gray-500 w-5 h-5" />
                  </div>
                </div>

                {/* Search Bar */}
                <div className="relative flex items-center bg-white border border-gray-200 rounded-full shadow-sm px-4 py-1.5 mb-4">
                  <input
                    type="text"
                    value={settings.searchText}
                    onChange={(e) => setSettings({ ...settings, searchText: e.target.value })}
                    className="flex-1 outline-none text-gray-800 text-base"
                  />
                  <X 
                    className="text-gray-400 w-5 h-5 mx-2 cursor-pointer" 
                    onClick={(e) => {
                      e.stopPropagation();
                      setSettings({ ...settings, searchText: '' });
                    }}
                  />
                  <div className="h-6 w-[1px] bg-gray-200 mx-1"></div>
                  <div className="bg-[#4285F4] p-1.5 rounded-r-full -mr-4 ml-2">
                    <Search className="text-white w-5 h-5" />
                  </div>
                </div>

                {/* Tabs */}
                <div className="flex overflow-x-auto no-scrollbar text-sm font-medium text-gray-500 gap-6 whitespace-nowrap border-b border-gray-100">
                  <div 
                    onDoubleClick={handleAiModeDoubleClick}
                    className="pb-2 cursor-pointer"
                  >
                    AI Mode
                  </div>
                  <div className="pb-2">Tutti</div>
                  <div className="pb-2 text-[#4285F4] border-b-2 border-[#4285F4]">Immagini</div>
                  <div className="pb-2">Notizie</div>
                  <div className="pb-2">Video</div>
                  <div className="pb-2">Mappe</div>
                </div>
              </div>
            </header>

            {/* Indicator Dots for 3rd click */}
            {clickCount >= 2 && (
              <>
                <div className="fixed top-1 left-1 w-1 h-1 bg-black rounded-full z-[100] pointer-events-none opacity-40"></div>
                <div className="fixed bottom-1 right-1 w-1 h-1 bg-black rounded-full z-[100] pointer-events-none opacity-40"></div>
              </>
            )}

            {/* --- Content --- */}
            <main className="flex-1 flex flex-col" data-screenshot-area="true">
              {/* First Screenshot */}
              <div className="w-full">
                {currentImages.image1 ? (
                  <img 
                    src={currentImages.image1} 
                    alt="Screenshot 1" 
                    className="w-full h-auto block"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full aspect-[9/16] bg-blue-600 flex items-center justify-center text-white text-2xl font-bold">
                    primo screenshot
                  </div>
                )}
              </div>

              {/* Loading Zone / Pause Trigger */}
              <div ref={loadingRef} className="w-full h-1 bg-transparent"></div>

              {/* Spinner during pause */}
              <AnimatePresence>
                {isPaused && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 100 }}
                    exit={{ opacity: 0, height: 0 }}
                    className="w-full flex items-center justify-center bg-white overflow-hidden"
                  >
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                    >
                      <RefreshCw className="w-8 h-8 text-[#4285F4]" />
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Second Screenshot */}
              <div className={`w-full transition-opacity duration-300 ${hasLoadedSecond ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden'}`}>
                {currentImages.image2 ? (
                  <img 
                    src={currentImages.image2} 
                    alt="Screenshot 2" 
                    className="w-full h-auto block"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full aspect-[9/16] bg-red-600 flex items-center justify-center text-white text-2xl font-bold">
                    secondo screenshot
                  </div>
                )}
              </div>
            </main>

            {/* --- Expanded Image View --- */}
            <AnimatePresence>
              {expandedImage && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={handleExpandedClick}
                  className="fixed inset-0 z-[60] bg-black overflow-y-auto"
                >
                  <div className="w-full min-h-full">
                    <img 
                      src={
                        expandedImage === 1 ? currentImages.expandedImage1! : 
                        expandedImage === 2 ? currentImages.expandedImage2! : 
                        currentImages.expandedImage3!
                      } 
                      className="w-full h-auto block"
                      alt="Expanded"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>


        ) : (
          <motion.div
            key="secret-menu"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 bg-white z-50 flex flex-col overflow-y-auto"
          >
            <div className="p-6 flex-1 flex flex-col">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-bold text-gray-800">Menu Segreto</h2>
                <button 
                  onClick={() => setIsMenuOpen(false)} 
                  className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
                >
                  <X className="w-6 h-6 text-gray-600" />
                </button>
              </div>

              <div className="space-y-8 flex-1">
                {editingPresetId ? (
                  <div className="space-y-8">
                    <button 
                      onClick={() => setEditingPresetId(null)}
                      className="text-[#4285F4] font-medium flex items-center gap-2 mb-4"
                    >
                      ← Torna ai Preset
                    </button>
                    
                    <h3 className="text-xl font-bold text-gray-800">{PRESETS[editingPresetId].name}</h3>

                    {/* Main Screenshots */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-400 mb-2 uppercase">Screenshot 1</label>
                        <div className="border border-gray-100 rounded-xl p-2 bg-gray-50 h-32 overflow-hidden relative">
                          <img src={PRESETS[editingPresetId].defaultImages.image1} className="w-full h-full object-cover" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-400 mb-2 uppercase">Screenshot 2</label>
                        <div className="border border-gray-100 rounded-xl p-2 bg-gray-50 h-32 overflow-hidden relative">
                          <img src={PRESETS[editingPresetId].defaultImages.image2} className="w-full h-full object-cover" />
                        </div>
                      </div>
                    </div>

                    {/* Expanded Images */}
                    <div className="space-y-6">
                      <h3 className="text-sm font-bold text-gray-800 border-b pb-2">Immagini Espandibili (Solo Visualizzazione)</h3>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">1: Prima immagine (1° click)</label>
                        <div className="border border-gray-100 rounded-xl p-2 bg-gray-50 h-40 overflow-hidden relative">
                          <img src={PRESETS[editingPresetId].defaultImages.expandedImage1} className="w-full h-full object-cover" />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">2: Seconda immagine (2° click)</label>
                        <div className="border border-gray-100 rounded-xl p-2 bg-gray-50 h-40 overflow-hidden relative">
                          <img src={PRESETS[editingPresetId].defaultImages.expandedImage2} className="w-full h-full object-cover" />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">3: Terza immagine (3° click)</label>
                        <div className="border border-gray-100 rounded-xl p-2 bg-gray-50 h-40 overflow-hidden relative">
                          <img src={PRESETS[editingPresetId].defaultImages.expandedImage3} className="w-full h-full object-cover" />
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Categorie Preset</h3>
                    {Object.values(PRESETS).map((preset) => (
                      <button
                        key={preset.id}
                        onClick={() => setEditingPresetId(preset.id)}
                        className="w-full text-left p-4 rounded-2xl border border-gray-100 bg-gray-50 hover:bg-gray-100 transition-all group"
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="font-bold text-gray-800 text-lg">{preset.name}</div>
                            <div className="text-sm text-gray-500">Force image: {preset.forceImageName}</div>
                            <div className="text-sm text-gray-500">Search word: {preset.searchText}</div>
                          </div>
                          <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                            <Search className="w-5 h-5 text-[#4285F4]" />
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Utility */}
                <div className="pt-4 space-y-4">
                  <button 
                    onClick={() => {
                      setClickCount(0);
                      alert('Contatore click resettato');
                    }}
                    className="text-sm text-[#4285F4] font-medium flex items-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Resetta contatore click ({clickCount})
                  </button>

                  <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                    <p className="text-xs text-blue-700 leading-relaxed">
                      <strong>Modalità Sola Lettura:</strong> Le immagini sono bloccate sui preset predefiniti per garantire la massima stabilità su Vercel.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-8 pb-4">
                <button 
                  onClick={() => setIsMenuOpen(false)}
                  className="w-full bg-[#4285F4] text-white py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 hover:bg-[#3367D6] active:scale-[0.98] transition-all shadow-xl shadow-blue-100"
                >
                  <Save className="w-6 h-6" />
                  Chiudi Menu
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}


