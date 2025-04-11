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

    function getPostIdFromUrl() {
        const params = new URLSearchParams(window.location.search);
        return params.get('id');
    }

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

    // --- Main Post Loading Logic ---
    async function loadPost(postId) {
        if (!postId) {
            postContentContainer.innerHTML = '<h2>无效的文章 ID</h2><p>无法加载文章，请确保链接正确。</p>';
            pageTitle.textContent = '错误 - 我的个人博客';
            if (likeButton) likeButton.disabled = true;
            return;
        }

        currentPostId = postId;

        try {
            const response = await fetch('posts.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const posts = await response.json();
            const post = posts.find(p => p.id === postId);

            if (post) {
                currentPostTitle = post.title;
                pageTitle.textContent = `${post.title} - 我的个人博客`;

                postContentContainer.innerHTML = ''; // Clear loading

                // Add Title and Meta
                const titleElement = document.createElement('h2');
                titleElement.textContent = post.title;
                postContentContainer.appendChild(titleElement);

                const metaElement = document.createElement('div');
                metaElement.classList.add('post-meta');
                metaElement.innerHTML = `<p>发布日期：${formatDate(post.date)}</p>`;
                postContentContainer.appendChild(metaElement);

                // Create container for actual content
                const contentElement = document.createElement('div');
                postContentContainer.appendChild(contentElement);

                // Load Marked.js first
                if (typeof marked === 'undefined') {
                    console.log("Loading Marked.js...");
                    loadScript('https://cdn.jsdelivr.net/npm/marked/marked.min.js', () => {
                        console.log("Marked.js loaded.");
                        renderAndProcessContent(contentElement, post.content || '');
                    });
                } else {
                    renderAndProcessContent(contentElement, post.content || '');
                }

                initializeLikeButton();

            } else {
                // Handle post not found
                postContentContainer.innerHTML = `<h2>文章未找到</h2><p>ID 为 "${postId}" 的文章不存在。</p>`;
                pageTitle.textContent = '文章未找到 - 我的个人博客';
                 if (likeButton) likeButton.disabled = true;
            }

        } catch (error) {
            // Handle fetch error
            console.error('加载文章失败:', error);
            postContentContainer.innerHTML = '<h2>加载文章时出错</h2><p>请稍后重试。</p>';
            pageTitle.textContent = '加载错误 - 我的个人博客';
             if (likeButton) likeButton.disabled = true;
        }
    }

    // --- Content Rendering and Enhancement Pipeline ---
    function renderAndProcessContent(container, markdownContent) {
        // 1. Render Markdown using standard Marked.js
        marked.use(); // Ensure standard renderer
        container.innerHTML = marked.parse(markdownContent, { breaks: true, gfm: true });

        // 2. Prepare and Initialize Mermaid
        prepareAndRunMermaid(container);

        // 3. Highlight and Enhance other code blocks
        highlightAndEnhanceCodeBlocks(container);
    }

    // --- Prepare Mermaid Blocks and Initialize Mermaid ---
    function prepareAndRunMermaid(container) {
        const mermaidCodeBlocks = container.querySelectorAll('pre code.language-mermaid');
        if (mermaidCodeBlocks.length === 0) return;

        const mermaidElementsToRender = [];
        mermaidCodeBlocks.forEach(codeBlock => {
            const pre = codeBlock.closest('pre');
            if (pre) {
                const mermaidDiv = document.createElement('div');
                mermaidDiv.className = 'mermaid';
                mermaidDiv.textContent = codeBlock.textContent || ''; // Get raw text
                pre.parentNode.replaceChild(mermaidDiv, pre); // Replace <pre> with <div>
                mermaidElementsToRender.push(mermaidDiv);
            }
        });

        if (mermaidElementsToRender.length > 0) {
            if (typeof mermaid === 'undefined') {
                console.log("Loading Mermaid.js...");
                loadScript('https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js', () => {
                    console.log("Mermaid.js loaded.");
                    runMermaid(mermaidElementsToRender);
                });
            } else {
                runMermaid(mermaidElementsToRender);
            }
        }
    }

    function runMermaid(elements) {
         try {
            mermaid.initialize({ startOnLoad: false, theme: 'neutral' });
            mermaid.run({ nodes: elements });
            console.log(`Mermaid diagrams rendered/re-rendered for ${elements.length} elements.`);
        } catch (error) {
            handleMermaidError(error, elements);
        }
    }

    function handleMermaidError(error, elements) {
        console.error("Mermaid rendering failed:", error);
        elements.forEach(el => {
            if (!el.dataset.mermaidError) {
                el.innerHTML = `<div style="color: red; font-weight: bold; padding: 1em;">Mermaid Error: ${error.message}</div>`;
                el.dataset.mermaidError = "true";
            }
        });
    }

    // --- Highlight Code and Enhance Blocks ---
    function highlightAndEnhanceCodeBlocks(container) {
        // Load highlight.js CSS
        loadStyle('https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github.min.css');

        // Find standard code blocks (<pre> elements that haven't been replaced by a mermaid <div>)
        const codeBlocksToProcess = container.querySelectorAll('pre:not(.mermaid)'); // Target <pre> not marked as mermaid

        if (codeBlocksToProcess.length === 0) return; // Exit if nothing to process

        // Load highlight.js script if needed
        if (typeof hljs === 'undefined') {
            console.log("Loading highlight.js for code blocks...");
            loadScript('https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js', () => {
                console.log("highlight.js loaded.");
                processCodeBlocks(codeBlocksToProcess);
            });
        } else {
            processCodeBlocks(codeBlocksToProcess);
        }
    }

    // Helper function to process (highlight and enhance) each standard code block
    function processCodeBlocks(blocks) {
        blocks.forEach(preElement => {
            const codeElement = preElement.querySelector('code');
            if (codeElement) { // Check if code element exists
                // Highlight
                hljs.highlightElement(codeElement);
                // Enhance (add button/tag)
                addEnhancementsToBlock(preElement, codeElement);
            }
        });
        console.log("Code block highlighting and enhancements applied.");
    }

    // --- Add Copy Buttons and Language Tags to a specific Code Block ---
    function addEnhancementsToBlock(preElement, codeElement) {
        // SVG icons (defined once)
        const copyIconSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-clipboard" viewBox="0 0 16 16"><path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1z"/><path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h3zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3z"/></svg>`;
        const copiedIconSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-check-lg" viewBox="0 0 16 16"><path d="M12.736 3.97a.733.733 0 0 1 1.047 0c.286.289.29.756.01 1.05L7.88 12.01a.733.733 0 0 1-1.065.02L3.217 8.384a.757.757 0 0 1 0-1.06.733.733 0 0 1 1.047 0l3.052 3.093 5.4-6.425a.247.247 0 0 1 .02-.022z"/></svg>`;

        // Prevent adding enhancements multiple times
        if (preElement.querySelector('.copy-code-button')) return;

        preElement.style.position = 'relative'; // Needed for absolute positioning

        // --- Add Language Tag ---
        const languageClass = Array.from(codeElement.classList).find(cls => cls.startsWith('language-'));
        if (languageClass) {
            const languageName = languageClass.replace('language-', '').toLowerCase();
            if (!preElement.querySelector('.code-language-tag')) {
                const langTag = document.createElement('span');
                langTag.className = 'code-language-tag';
                langTag.textContent = languageName;
                preElement.appendChild(langTag);
            }
        }

        // --- Add Copy Button ---
        const button = document.createElement('button');
        button.innerHTML = copyIconSVG;
        button.className = 'copy-code-button';
        button.setAttribute('aria-label', '复制代码');

        button.addEventListener('click', () => {
            const codeToCopy = codeElement.innerText || codeElement.textContent;
            navigator.clipboard.writeText(codeToCopy).then(() => {
                button.innerHTML = copiedIconSVG;
                button.disabled = true;
                setTimeout(() => {
                    button.innerHTML = copyIconSVG;
                    button.disabled = false;
                }, 2000);
            }).catch(err => {
                console.error('无法复制到剪贴板:', err);
                button.innerHTML = '失败';
                 setTimeout(() => {
                    button.innerHTML = copyIconSVG;
                }, 2000);
            });
        });
        preElement.appendChild(button);
    } // End of addEnhancementsToBlock


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
            likes[postId] = (likes[postId] || 1) - 1; // Simulate decrement
        } else {
            // Like
            likedPosts[postId] = true;
            likes[postId] = (likes[postId] || 0) + 1; // Simulate increment
        }

        localStorage.setItem('userLikedPosts', JSON.stringify(likedPosts));
        // localStorage.setItem('blogLikes', JSON.stringify(likes)); // Not really storing count

        updateLikeButtonState(postId);
    }

    function updateLikeButtonState(postId) {
        if (!likeButton || !likeCountSpan) return;

        const liked = hasUserLikedPost(postId);

        if (liked) {
            likeButton.textContent = '已赞';
            likeButton.classList.add('liked');
        } else {
            likeButton.textContent = '点赞';
            likeButton.classList.remove('liked');
        }
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


    // --- Comment System Initialization (No longer needed for Giscus) ---
    // Giscus is loaded and configured directly via the script tag in post.html.


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