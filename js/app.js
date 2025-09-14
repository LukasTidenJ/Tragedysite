// ===== CONFIGURATION =====
const CONFIG = {
  // Cloudflare R2 Configuration
  r2: {
    endpoint: 'https://your-account.r2.cloudflarestorage.com',
    bucketName: 'prodtragedy-beats',
    publicUrl: 'https://beats.prodtragedy.com', // Your R2 public URL
  },

  // App Configuration
  beatsPerPage: 12,
  enableAnalytics: true,
  enableServiceWorker: true,
};

// ===== GLOBAL STATE =====
let state = {
  allBeats: [],
  filteredBeats: [],
  currentPage: 1,
  isLoading: false,
  currentFilter: 'all',
  searchQuery: '',
};

// ===== DOM ELEMENTS =====
const elements = {
  beatsContainer: document.getElementById('beats-container'),
  searchInput: document.getElementById('search-input'),
  beatCount: document.getElementById('beat-count'),
  loadMoreBtn: document.getElementById('load-more-btn'),
  filterBtns: document.querySelectorAll('.filter-btn'),
  mobileMenuToggle: document.querySelector('.mobile-menu-toggle'),
  navLinks: document.querySelector('.nav-links'),
};

// ===== UTILITY FUNCTIONS =====
const utils = {
  // Debounce function for search
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  // Format duration from seconds to MM:SS
  formatDuration(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  },

  // Animate number counting
  animateNumber(element, target, duration = 1000) {
    const start = 0;
    const increment = target / (duration / 16);
    let current = start;

    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        current = target;
        clearInterval(timer);
      }
      element.textContent = Math.floor(current);
    }, 16);
  },

  // Check if element is in viewport
  isInViewport(element) {
    const rect = element.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  },

  // Show notification
  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;

    notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            background: ${type === 'error' ? '#ff6b6b' : '#4ecdc4'};
            color: white;
            border-radius: 10px;
            z-index: 10000;
            animation: slideIn 0.3s ease;
        `;

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  },
};

// ===== BEAT LOADING FUNCTIONS =====
const beatLoader = {
  async loadBeats() {
    try {
      state.isLoading = true;
      this.showLoading();

      console.log('🎵 Loading beats from data source...');

      // Try to load from local data first, then R2
      let beatsData;

      try {
        // Load from local data/beats.json first
        const localResponse = await fetch('./data/beats.json');
        if (localResponse.ok) {
          beatsData = await localResponse.json();
          console.log('✅ Loaded beats from local data');
        }
      } catch (error) {
        console.log('📁 Local data not found, trying R2...');
      }

      // If local data failed, try R2
      if (!beatsData) {
        try {
          const r2Response = await fetch(`${CONFIG.r2.publicUrl}/beats-metadata.json`);
          if (r2Response.ok) {
            beatsData = await r2Response.json();
            console.log('☁️ Loaded beats from Cloudflare R2');
          }
        } catch (error) {
          console.log('☁️ R2 data not found, using sample data');
        }
      }

      // Fallback to sample data
      if (!beatsData) {
        beatsData = this.getSampleBeats();
        console.log('📝 Using sample beats data');
      }

      state.allBeats = beatsData.beats || beatsData || [];
      state.filteredBeats = [...state.allBeats];

      this.displayBeats();
      this.updateBeatCount();

      console.log(`✅ Successfully loaded ${state.allBeats.length} beats!`);
    } catch (error) {
      console.error('❌ Error loading beats:', error);
      this.showError('Failed to load beats. Please try again later.');
    } finally {
      state.isLoading = false;
    }
  },

  getSampleBeats() {
    return [
      {
        id: 1,
        title: 'Midnight Vibes',
        genre: 'trap',
        bpm: 140,
        key: 'C Minor',
        duration: '3:45',
        price: '$4.99',
        audioFile: 'sample-beat-1.mp3',
        tags: ['dark', 'atmospheric', 'hard'],
        description: 'Dark trap beat with atmospheric pads and hard 808s',
      },
      {
        id: 2,
        title: 'Ocean Dreams',
        genre: 'r&b',
        bpm: 85,
        key: 'F Major',
        duration: '4:12',
        price: '$4.99',
        audioFile: 'sample-beat-2.mp3',
        tags: ['smooth', 'romantic', 'chill'],
        description: 'Smooth R&B instrumental perfect for romantic tracks',
      },
      {
        id: 3,
        title: 'Street Kings',
        genre: 'hip-hop',
        bpm: 95,
        key: 'G Minor',
        duration: '3:28',
        price: '$4.99',
        audioFile: 'sample-beat-3.mp3',
        tags: ['classic', 'boom bap', 'street'],
        description: 'Classic boom bap hip hop with street vibes',
      },
      {
        id: 4,
        title: 'Drill Sergeant',
        genre: 'drill',
        bpm: 145,
        key: 'D Minor',
        duration: '2:58',
        price: '$4.99',
        audioFile: 'sample-beat-4.mp3',
        tags: ['aggressive', 'UK drill', 'intense'],
        description: 'Aggressive UK drill beat with sliding 808s',
      },
      {
        id: 5,
        title: 'Sunset Boulevard',
        genre: 'trap',
        bpm: 130,
        key: 'A Minor',
        duration: '3:33',
        price: '$4.99',
        audioFile: 'sample-beat-5.mp3',
        tags: ['melodic', 'sunset', 'emotional'],
        description: 'Melodic trap beat with emotional piano leads',
      },
      {
        id: 6,
        title: 'Neon Nights',
        genre: 'hip-hop',
        bpm: 88,
        key: 'E Minor',
        duration: '4:05',
        price: '$4.99',
        audioFile: 'sample-beat-6.mp3',
        tags: ['retro', 'synthwave', 'night'],
        description: 'Retro-inspired hip hop with synthwave elements',
      },
    ];
  },

  displayBeats(beats = state.filteredBeats) {
    if (!elements.beatsContainer) return;

    if (beats.length === 0) {
      this.showEmptyState();
      return;
    }

    const beatsToShow = beats.slice(0, state.currentPage * CONFIG.beatsPerPage);

    elements.beatsContainer.innerHTML = beatsToShow
      .map(
        (beat) => `
            <div class="beat-card" data-beat-id="${beat.id}">
                <div class="beat-title">${beat.title}</div>
                <div class="beat-meta">
                    <span class="meta-item">🎼 ${beat.genre}</span>
                    <span class="meta-item">⚡ ${beat.bpm} BPM</span>
                    <span class="meta-item">🎹 ${beat.key}</span>
                    <span class="meta-item">⏰ ${beat.duration}</span>
                </div>
                
                ${beat.description ? `<p class="beat-description">${beat.description}</p>` : ''}
                
                <audio class="audio-player" controls preload="metadata">
                    <source src="${this.getAudioUrl(beat.audioFile)}" type="audio/mpeg">
                    <source src="${this.getAudioUrl(beat.audioFile.replace('.mp3', '.wav'))}" type="audio/wav">
                    Your browser does not support the audio element.
                </audio>
                
                <div class="beat-actions">
                    <span class="price-tag">💰 ${beat.price}</span>
                    <div class="action-buttons">
                        <button class="download-btn" onclick="beatPlayer.downloadBeat('${beat.audioFile}', '${beat.title}')" aria-label="Download ${beat.title}">
                            📥 Download
                        </button>
                        <button class="preview-btn" onclick="beatPlayer.togglePlay(${beat.id})" aria-label="Play ${beat.title}">
                            ▶️ Play
                        </button>
                    </div>
                </div>
                
                ${
                  beat.tags
                    ? `
                    <div class="beat-tags">
                        ${beat.tags.map((tag) => `<span class="tag">#${tag}</span>`).join('')}
                    </div>
                `
                    : ''
                }
            </div>
        `
      )
      .join('');

    // Show/hide load more button
    const hasMoreBeats = beats.length > state.currentPage * CONFIG.beatsPerPage;
    if (elements.loadMoreBtn) {
      elements.loadMoreBtn.style.display = hasMoreBeats ? 'block' : 'none';
    }

    // Initialize audio players
    this.initializeAudioPlayers();
  },

  getAudioUrl(audioFile) {
    // If file starts with http, return as is
    if (audioFile.startsWith('http')) {
      return audioFile;
    }

    // If R2 is configured, use R2 URL
    if (CONFIG.r2.publicUrl && CONFIG.r2.publicUrl !== 'https://beats.prodtragedy.com') {
      return `${CONFIG.r2.publicUrl}/audio/${audioFile}`;
    }

    // Fallback to local assets
    return `./assets/audio/${audioFile}`;
  },

  initializeAudioPlayers() {
    const audioPlayers = document.querySelectorAll('.audio-player');
    audioPlayers.forEach((player) => {
      player.addEventListener('loadstart', () => {
        console.log('Loading audio:', player.src);
      });

      player.addEventListener('error', (e) => {
        console.warn('Audio load error:', e);
        // Try to find alternative source
        const beatCard = player.closest('.beat-card');
        if (beatCard) {
          const errorMsg = document.createElement('div');
          errorMsg.className = 'audio-error';
          errorMsg.innerHTML = '🎵 Audio preview not available';
          errorMsg.style.cssText = `
                        text-align: center;
                        padding: 1rem;
                        background: rgba(255, 107, 107, 0.1);
                        border-radius: 10px;
                        color: #ff6b6b;
                        margin: 1rem 0;
                    `;
          player.parentNode.replaceChild(errorMsg, player);
        }
      });
    });
  },

  showLoading() {
    if (elements.beatsContainer) {
      elements.beatsContainer.innerHTML = `
                <div class="loading">
                    <div class="loading-spinner"></div>
                    <p>Loading premium beats...</p>
                </div>
            `;
    }
  },

  showError(message) {
    if (elements.beatsContainer) {
      elements.beatsContainer.innerHTML = `
                <div class="error-state">
                    <div class="error-icon">❌</div>
                    <h3>Unable to load beats</h3>
                    <p>${message}</p>
                    <button onclick="beatLoader.loadBeats()" class="retry-btn">Try Again</button>
                </div>
            `;
    }
    utils.showNotification(message, 'error');
  },

  showEmptyState() {
    if (elements.beatsContainer) {
      elements.beatsContainer.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">🎵</div>
                    <h3>No beats found</h3>
                    <p>Try adjusting your search or filter criteria</p>
                </div>
            `;
    }
  },

  updateBeatCount() {
    if (elements.beatCount) {
      utils.animateNumber(elements.beatCount, state.allBeats.length);
    }
  },
};

// ===== BEAT PLAYER FUNCTIONS =====
const beatPlayer = {
  currentlyPlaying: null,

  togglePlay(beatId) {
    const beatCard = document.querySelector(`[data-beat-id="${beatId}"]`);
    const audioPlayer = beatCard?.querySelector('.audio-player');
    const playBtn = beatCard?.querySelector('.preview-btn');

    if (!audioPlayer || !playBtn) return;

    // Stop currently playing audio
    if (this.currentlyPlaying && this.currentlyPlaying !== audioPlayer) {
      this.currentlyPlaying.pause();
      this.updatePlayButton(this.currentlyPlaying, false);
    }

    if (audioPlayer.paused) {
      audioPlayer.play();
      this.currentlyPlaying = audioPlayer;
      playBtn.innerHTML = '⏸️ Pause';
    } else {
      audioPlayer.pause();
      playBtn.innerHTML = '▶️ Play';
    }

    // Update button when audio ends
    audioPlayer.addEventListener('ended', () => {
      playBtn.innerHTML = '▶️ Play';
      this.currentlyPlaying = null;
    });
  },

  updatePlayButton(audioPlayer, isPlaying) {
    const beatCard = audioPlayer.closest('.beat-card');
    const playBtn = beatCard?.querySelector('.preview-btn');
    if (playBtn) {
      playBtn.innerHTML = isPlaying ? '⏸️ Pause' : '▶️ Play';
    }
  },

  downloadBeat(audioFile, title) {
    const url = beatLoader.getAudioUrl(audioFile);

    // Create download link
    const link = document.createElement('a');
    link.href = url;
    link.download = `${title}.mp3`;
    link.style.display = 'none';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Track download
    if (CONFIG.enableAnalytics) {
      this.trackEvent('beat_download', { beat_title: title, audio_file: audioFile });
    }

    utils.showNotification(`Downloading "${title}"...`);
  },

  trackEvent(eventName, properties = {}) {
    // Analytics tracking
    console.log('📊 Event:', eventName, properties);
    // Add your analytics service here (Google Analytics, Mixpanel, etc.)
  },
};

// ===== SEARCH & FILTER FUNCTIONS =====
const searchFilter = {
  search: utils.debounce((query) => {
    state.searchQuery = query.toLowerCase();
    this.applyFilters();
  }, 300),

  filter(genre) {
    state.currentFilter = genre;
    state.currentPage = 1; // Reset pagination
    this.applyFilters();
    this.updateFilterButtons();
  },

  applyFilters() {
    let filtered = [...state.allBeats];

    // Apply genre filter
    if (state.currentFilter !== 'all') {
      filtered = filtered.filter((beat) => beat.genre.toLowerCase() === state.currentFilter.toLowerCase());
    }

    // Apply search filter
    if (state.searchQuery) {
      filtered = filtered.filter(
        (beat) =>
          beat.title.toLowerCase().includes(state.searchQuery) ||
          beat.genre.toLowerCase().includes(state.searchQuery) ||
          beat.tags?.some((tag) => tag.toLowerCase().includes(state.searchQuery)) ||
          beat.bpm.toString().includes(state.searchQuery) ||
          beat.key.toLowerCase().includes(state.searchQuery)
      );
    }

    state.filteredBeats = filtered;
    beatLoader.displayBeats();
  },

  updateFilterButtons() {
    elements.filterBtns.forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.filter === state.currentFilter);
    });
  },
};

// ===== EVENT LISTENERS =====
const eventListeners = {
  init() {
    // Search input
    if (elements.searchInput) {
      elements.searchInput.addEventListener('input', (e) => {
        searchFilter.search(e.target.value);
      });
    }

    // Filter buttons
    elements.filterBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        searchFilter.filter(btn.dataset.filter);
      });
    });

    // Load more button
    if (elements.loadMoreBtn) {
      elements.loadMoreBtn.addEventListener('click', () => {
        state.currentPage++;
        beatLoader.displayBeats();
      });
    }

    // Mobile menu toggle
    if (elements.mobileMenuToggle && elements.navLinks) {
      elements.mobileMenuToggle.addEventListener('click', () => {
        elements.navLinks.classList.toggle('active');
      });
    }

    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
      anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
          target.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
          });
        }
      });
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      // Ctrl/Cmd + F to focus search
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        elements.searchInput?.focus();
      }

      // Escape to clear search
      if (e.key === 'Escape') {
        if (elements.searchInput) {
          elements.searchInput.value = '';
          searchFilter.search('');
        }
      }
    });

    // Header scroll effect
    let lastScrollY = window.scrollY;
    window.addEventListener('scroll', () => {
      const header = document.querySelector('.header');
      if (header) {
        if (window.scrollY > lastScrollY && window.scrollY > 100) {
          header.style.transform = 'translateY(-100%)';
        } else {
          header.style.transform = 'translateY(0)';
        }
        lastScrollY = window.scrollY;
      }
    });
  },
};

// ===== INITIALIZATION =====
const app = {
  async init() {
    console.log('🎵 Initializing ProdTragedy Beats App...');

    // Initialize event listeners
    eventListeners.init();

    // Load beats
    await beatLoader.loadBeats();

    // Register service worker
    if (CONFIG.enableServiceWorker && 'serviceWorker' in navigator) {
      this.registerServiceWorker();
    }

    console.log('✅ App initialized successfully!');
  },

  async registerServiceWorker() {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('✅ Service Worker registered:', registration);
    } catch (error) {
      console.log('❌ Service Worker registration failed:', error);
    }
  },
};

// ===== APP START =====
// Wait for DOM to be fully loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', app.init);
} else {
  app.init();
}

// ===== GLOBAL ERROR HANDLING =====
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
  utils.showNotification('Something went wrong. Please refresh the page.', 'error');
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  utils.showNotification('Something went wrong. Please try again.', 'error');
});

// ===== EXPORT FOR TESTING =====
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { app, beatLoader, beatPlayer, searchFilter, utils };
}
