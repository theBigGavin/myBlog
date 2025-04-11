// Function to load a script dynamically
// Function to load a script dynamically
function loadScript(src, callback) {
    if (document.querySelector(`script[src="${src}"]`)) {
        if (callback) callback(); // Already loaded or loading
        return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.onload = callback;
    script.onerror = () => console.error(`Failed to load script: ${src}`);
    document.head.appendChild(script);
}

// Function to load a CSS stylesheet dynamically
function loadStyle(href) {
     if (document.querySelector(`link[href="${href}"]`)) {
        return; // Already loaded
    }
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.onerror = () => console.error(`Failed to load stylesheet: ${href}`);
    document.head.appendChild(link);
}

document.addEventListener('DOMContentLoaded', () => {
    const postContentContainer = document.getElementById('post-content');
    const pageTitle = document.querySelector('title');
    const likeButton = document.getElementById('like-button');
    const likeCountSpan = document.getElementById('like-count');
    // Giscus is loaded via script tag in HTML, no JS variable needed here.

    let currentPostId = null;
    let currentPostTitle = '文章详情'; // Default title

    // --- Helper Functions ---

    // Get post ID from URL query parameter (e.g., ?id=post-1)
    function getPostIdFromUrl() {
        const params = new URLSearchParams(window.location.search);
        return params.get('id');
    }

    // Format date (consistent with script.js)
    function formatDate(dateString) {
        try {
            const dateObj = new Date(dateString);
            const adjustedDate = new Date(dateObj.getTime() + dateObj.getTimezoneOffset() * 60000);
            return adjustedDate.toLocaleDateString('zh-CN');
        } catch (e) {
            console.warn(`无法解析日期 "${dateString}". 使用原始日期。`);
            return dateString;
        }
    }

    // Load and display the specific post
    async function loadPost(postId) {
        if (!postId) {
            postContentContainer.innerHTML = '<h2>无效的文章 ID</h2><p>无法加载文章，请确保链接正确。</p>';
            pageTitle.textContent = '错误 - 我的个人博客';
            if (likeButton) likeButton.disabled = true;
            return;
        }

        currentPostId = postId; // Store the ID for like/comment functions

        try {
            const response = await fetch('posts.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const posts = await response.json();
            const post = posts.find(p => p.id === postId);

            if (post) {
                currentPostTitle = post.title; // Store title
                pageTitle.textContent = `${post.title} - 我的个人博客`; // Update page title

                // Clear loading message and add markdown-body class to the main container
                postContentContainer.innerHTML = '';
                postContentContainer.classList.add('markdown-body');

                // Create title element
                const titleElement = document.createElement('h2');
                titleElement.textContent = post.title;
                postContentContainer.appendChild(titleElement);

                // Create meta element
                const metaElement = document.createElement('div');
                metaElement.classList.add('post-meta');
                metaElement.innerHTML = `<p>发布日期：${formatDate(post.date)}</p>`;
                postContentContainer.appendChild(metaElement);

                // Create content container for Markdown rendering
                const contentElement = document.createElement('div');
                // contentElement.classList.add('markdown-body'); // Moved class to parent container
                postContentContainer.appendChild(contentElement);

                // Function to render content, highlight code, and add copy buttons
                const renderAndEnhanceContent = () => {
                    // Configure marked (optional: enable GitHub Flavored Markdown, etc.)
                    // marked.setOptions({ gfm: true, breaks: true });
                    contentElement.innerHTML = marked.parse(post.content || ''); // Render Markdown

                    // Load highlight.js CSS (e.g., GitHub theme)
                    loadStyle('https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github.min.css');

                    // Load highlight.js core and highlight code blocks
                    if (typeof hljs === 'undefined') {
                        console.log("Loading highlight.js...");
                        loadScript('https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js', () => {
                             console.log("highlight.js loaded.");
                             hljs.highlightAll(); // Highlight all code blocks
                             enhanceCodeBlocks(contentElement); // Enhance code blocks after highlighting
                             initializeMermaid(contentElement); // Initialize Mermaid after highlighting
                        });
                    } else {
                        hljs.highlightAll(); // Highlight if already loaded
                        enhanceCodeBlocks(contentElement); // Enhance code blocks if already loaded
                        initializeMermaid(contentElement); // Initialize Mermaid if already loaded
                    }
                };

                // Load Marked.js and then render/enhance
                if (typeof marked === 'undefined') {
                    console.log("Loading Marked.js...");
                    loadScript('https://cdn.jsdelivr.net/npm/marked/marked.min.js', () => {
                        console.log("Marked.js loaded.");
                        renderAndEnhanceContent();
                    });
                } else {
                    renderAndEnhanceContent(); // Render/enhance if Marked.js already loaded
                }

                // Initialize like button state
                initializeLikeButton();

                // Giscus is initialized via its script tag in post.html

            } else {
                postContentContainer.innerHTML = `<h2>文章未找到</h2><p>ID 为 "${postId}" 的文章不存在。</p>`;
                pageTitle.textContent = '文章未找到 - 我的个人博客';
                 if (likeButton) likeButton.disabled = true;
            }

        } catch (error) {
            console.error('加载文章失败:', error);
            postContentContainer.innerHTML = '<h2>加载文章时出错</h2><p>请稍后重试。</p>';
            pageTitle.textContent = '加载错误 - 我的个人博客';
             if (likeButton) likeButton.disabled = true;
        }
    }

    // --- Like Button Logic (using localStorage) ---

    function getLikesForPost(postId) {
        const likes = JSON.parse(localStorage.getItem('blogLikes') || '{}');
        return likes[postId] || 0; // Return count (we only store 'liked' status here)
    }

    function hasUserLikedPost(postId) {
        const likedPosts = JSON.parse(localStorage.getItem('userLikedPosts') || '{}');
        return likedPosts[postId] === true;
    }

    function toggleLikeForPost(postId) {
        let likedPosts = JSON.parse(localStorage.getItem('userLikedPosts') || '{}');
        let likes = JSON.parse(localStorage.getItem('blogLikes') || '{}'); // Although we don't store count, let's keep structure

        if (likedPosts[postId]) {
            // Unlike
            delete likedPosts[postId];
            // In a real scenario, you'd decrement a server-side counter
            likes[postId] = (likes[postId] || 1) - 1; // Simulate decrement (won't persist)
        } else {
            // Like
            likedPosts[postId] = true;
            // In a real scenario, you'd increment a server-side counter
            likes[postId] = (likes[postId] || 0) + 1; // Simulate increment (won't persist)
        }

        localStorage.setItem('userLikedPosts', JSON.stringify(likedPosts));
        // localStorage.setItem('blogLikes', JSON.stringify(likes)); // Not really storing count

        updateLikeButtonState(postId);
    }

    function updateLikeButtonState(postId) {
        if (!likeButton || !likeCountSpan) return;

        const liked = hasUserLikedPost(postId);
        // const count = getLikesForPost(postId); // Simulated count isn't reliable

        if (liked) {
            likeButton.textContent = '已赞';
            likeButton.classList.add('liked');
        } else {
            likeButton.textContent = '点赞';
            likeButton.classList.remove('liked');
        }
        // Display a simple message instead of a count from localStorage
        likeCountSpan.textContent = liked ? '您已点赞' : '';
    }

    function initializeLikeButton() {
        if (!likeButton || !currentPostId) return;
        likeButton.disabled = false;
        updateLikeButtonState(currentPostId);

        likeButton.onclick = () => {
            toggleLikeForPost(currentPostId);
        };
    }

    // --- Initialize Mermaid ---
    function initializeMermaid(container) {
        const mermaidBlocks = container.querySelectorAll('pre code.language-mermaid');
        if (mermaidBlocks.length === 0) {
            // No mermaid blocks found, no need to load the library
            return;
        }

        // Add 'mermaid' class to parent 'pre' for easier targeting if needed
        mermaidBlocks.forEach(block => {
            const pre = block.closest('pre');
            if (pre && !pre.classList.contains('mermaid')) {
                pre.classList.add('mermaid');
                // Mermaid expects the raw text content, not highlighted code
                // Restore original text content before mermaid runs
                // Note: This assumes the original markdown is stored somewhere or can be retrieved.
                // If not, this approach might need adjustment.
                // For now, we'll let mermaid try to parse the content directly.
                // It might work if highlight.js doesn't heavily modify the structure.
            }
        });


        if (typeof mermaid === 'undefined') {
            console.log("Loading Mermaid.js...");
            // Load Mermaid script
            loadScript('https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js', () => {
                console.log("Mermaid.js loaded.");
                try {
                    mermaid.initialize({ startOnLoad: false, theme: 'neutral' }); // Initialize manually
                    // Use mermaid.run() to render all elements with class 'mermaid'
                    // Mermaid API looks for elements with class="mermaid" containing the diagram text
                    mermaid.run({ nodes: container.querySelectorAll('pre.mermaid') }); // Target the parent pre element
                    console.log("Mermaid diagrams rendered.");
                } catch (error) {
                     console.error("Mermaid rendering failed:", error);
                     // Display error message in the block
                     container.querySelectorAll('pre.mermaid').forEach(pre => {
                         if (!pre.dataset.mermaidError) { // Prevent multiple error messages
                            pre.innerHTML = `<div style="color: red; font-weight: bold;">Mermaid Error: ${error.message}</div>`;
                            pre.dataset.mermaidError = "true";
                         }
                     });
                }
            });
        } else {
             try {
                // Re-run if Mermaid is already loaded
                mermaid.run({ nodes: container.querySelectorAll('pre.mermaid') });
                console.log("Mermaid diagrams re-rendered.");
            } catch (error) {
                 console.error("Mermaid re-rendering failed:", error);
                 container.querySelectorAll('pre.mermaid').forEach(pre => {
                     if (!pre.dataset.mermaidError) {
                        pre.innerHTML = `<div style="color: red; font-weight: bold;">Mermaid Error: ${error.message}</div>`;
                        pre.dataset.mermaidError = "true";
                     }
                 });
            }
        }
    }

    // This block was duplicated, removing it.

    // --- Enhance Code Blocks (Add Copy Button and Language Tag) ---
    function enhanceCodeBlocks(container) { // Accept container element
        // SVG icons
        const copyIconSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-clipboard" viewBox="0 0 16 16"><path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1z"/><path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h3zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3z"/></svg>`;
        const copiedIconSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-check-lg" viewBox="0 0 16 16"><path d="M12.736 3.97a.733.733 0 0 1 1.047 0c.286.289.29.756.01 1.05L7.88 12.01a.733.733 0 0 1-1.065.02L3.217 8.384a.757.757 0 0 1 0-1.06.733.733 0 0 1 1.047 0l3.052 3.093 5.4-6.425a.247.247 0 0 1 .02-.022z"/></svg>`;

        const codeBlocks = container.querySelectorAll('pre'); // Query within the specific container
        codeBlocks.forEach(block => {
            // Prevent adding button multiple times
            if (block.querySelector('.copy-code-button')) {
                return;
            }

            const codeElement = block.querySelector('code');
            if (!codeElement) return; // Skip if no code element found

            // --- Add Language Tag ---
            const languageClass = Array.from(codeElement.classList).find(cls => cls.startsWith('language-'));
            if (languageClass) {
                const languageName = languageClass.replace('language-', '').toLowerCase();
                // Prevent adding tag multiple times
                if (!block.querySelector('.code-language-tag')) {
                    const langTag = document.createElement('span');
                    langTag.className = 'code-language-tag';
                    langTag.textContent = languageName;
                    block.appendChild(langTag); // Append language tag
                }
            }

            // --- Add Copy Button ---

            // This block was duplicated, removing it.
            const button = document.createElement('button');
            button.innerHTML = copyIconSVG; // Set initial icon
            button.className = 'copy-code-button';
            button.setAttribute('aria-label', '复制代码'); // Accessibility
            // Make pre relative for absolute positioning of button
            block.style.position = 'relative';

            button.addEventListener('click', () => {
                const codeToCopy = codeElement.innerText || codeElement.textContent;
                navigator.clipboard.writeText(codeToCopy).then(() => {
                    button.innerHTML = copiedIconSVG; // Change to copied icon
                    button.disabled = true;
                    setTimeout(() => {
                        button.innerHTML = copyIconSVG; // Change back to copy icon
                        button.disabled = false;
                    }, 2000); // Reset after 2 seconds
                }).catch(err => {
                    console.error('无法复制到剪贴板:', err);
                    button.innerHTML = '失败'; // Keep text for error
                     setTimeout(() => {
                        button.innerHTML = copyIconSVG; // Change back to copy icon
                    }, 2000);
                });
            });

            block.appendChild(button);
        });
    }

    // --- Comment System Initialization (No longer needed for Giscus) ---
    // Giscus is loaded and configured directly via the script tag in post.html.
    // No specific JavaScript initialization is required here.


    // --- Initial Load ---
    const postId = getPostIdFromUrl();
    loadPost(postId);

    // Initialize particles.js (copied from script.js, ensure it runs on this page too)
    if (document.getElementById('particles-js')) {
      particlesJS('particles-js', { /* ... particles.js config object ... */
        "particles": { "number": { "value": 80, "density": { "enable": true, "value_area": 800 } }, "color": { "value": "#8800FF" }, "shape": { "type": "circle", "stroke": { "width": 0, "color": "#000000" }, "polygon": { "nb_sides": 5 }, "image": { "src": "img/github.svg", "width": 100, "height": 100 } }, "opacity": { "value": 0.5, "random": false, "anim": { "enable": false, "speed": 1, "opacity_min": 0.1, "sync": false } }, "size": { "value": 3, "random": true, "anim": { "enable": false, "speed": 40, "size_min": 0.1, "sync": false } }, "line_linked": { "enable": true, "distance": 150, "color": "#8800FF", "opacity": 0.4, "width": 1 }, "move": { "enable": true, "speed": 4, "direction": "none", "random": false, "straight": false, "out_mode": "out", "bounce": false, "attract": { "enable": false, "rotateX": 600, "rotateY": 1200 } } }, "interactivity": { "detect_on": "canvas", "events": { "onhover": { "enable": true, "mode": "repulse" }, "onclick": { "enable": true, "mode": "push" }, "resize": true }, "modes": { "grab": { "distance": 400, "line_linked": { "opacity": 1 } }, "bubble": { "distance": 400, "size": 40, "duration": 2, "opacity": 8, "speed": 3 }, "repulse": { "distance": 100, "duration": 0.4 }, "push": { "particles_nb": 4 }, "remove": { "particles_nb": 2 } } }, "retina_detect": true
      });
      console.log("Particles.js 已初始化！(post.js)");
    }

    console.log("文章页面脚本 (post.js) 已加载！");
});