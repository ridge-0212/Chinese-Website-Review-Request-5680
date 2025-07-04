import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// History store
export const useHistoryStore = create(
  persist(
    (set, get) => ({
      entries: [],
      addEntry: (entry) => set((state) => ({
        entries: [
          {
            id: Date.now().toString(),
            createdAt: new Date().toISOString(),
            ...entry
          },
          ...state.entries
        ]
      })),
      removeEntry: (id) => set((state) => ({
        entries: state.entries.filter(entry => entry.id !== id)
      })),
      clearHistory: () => set({ entries: [] }),
      getEntry: (id) => get().entries.find(entry => entry.id === id)
    }),
    {
      name: 'repromp-history'
    }
  )
);

// Settings store
export const useSettingsStore = create(
  persist(
    (set, get) => ({
      visionatiKey: '',
      straicoKey: '',
      defaultTemplateParams: {
        style: 'Photorealistic',
        length: 'Medium',
        tone: 'Descriptive',
        artisticStyle: 'None',
        mood: 'Neutral',
        lighting: 'Natural',
        composition: 'Balanced',
        manualPrompt: ''
      },
      setVisionatiKey: (key) => {
        set({ visionatiKey: key });
        // Also save to localStorage for immediate access
        if (key) {
          localStorage.setItem('visionati_api_key', key);
        } else {
          localStorage.removeItem('visionati_api_key');
        }
      },
      setStraicoKey: (key) => {
        set({ straicoKey: key });
        // Also save to localStorage for immediate access
        if (key) {
          localStorage.setItem('straico_api_key', key);
        } else {
          localStorage.removeItem('straico_api_key');
        }
      },
      setDefaultTemplateParams: (params) => set({ defaultTemplateParams: params }),
      updateSettings: (settings) => set(settings),
      // Initialize from localStorage
      initializeFromStorage: () => {
        const visionatiKey = localStorage.getItem('visionati_api_key') || '';
        const straicoKey = localStorage.getItem('straico_api_key') || '';
        set({ visionatiKey, straicoKey });
      }
    }),
    {
      name: 'repromp-settings',
      // Ensure localStorage sync
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Sync with localStorage on hydration
          const visionatiKey = localStorage.getItem('visionati_api_key') || '';
          const straicoKey = localStorage.getItem('straico_api_key') || '';
          if (visionatiKey !== state.visionatiKey || straicoKey !== state.straicoKey) {
            state.visionatiKey = visionatiKey;
            state.straicoKey = straicoKey;
          }
        }
      }
    }
  )
);

// UI state store
export const useUIStore = create((set) => ({
  isAnalyzing: false,
  isGenerating: false,
  currentImage: null,
  currentDescription: null,
  currentPrompts: [],
  error: null,
  setAnalyzing: (status) => set({ isAnalyzing: status }),
  setGenerating: (status) => set({ isGenerating: status }),
  setCurrentImage: (image) => set({ currentImage: image }),
  setCurrentDescription: (description) => set({ currentDescription: description }),
  setCurrentPrompts: (prompts) => set({ currentPrompts: prompts }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),
  reset: () => set({
    currentImage: null,
    currentDescription: null,
    currentPrompts: [],
    error: null,
    isAnalyzing: false,
    isGenerating: false
  })
}));