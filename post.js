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

                // Clear loading message and render post
                postContentContainer.innerHTML = `
                    <h2>${post.title}</h2>
                    <div class="post-meta">
                        <p>发布日期：${formatDate(post.date)}</p>
                    </div>
                    <p>${post.content.replace(/\n/g, '<br>')}</p> <!-- Basic newline handling -->
                `;

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

    // --- Comment System Initialization (No longer needed for Giscus) ---
    // Giscus is loaded and configured directly via the script tag in post.html.
    // No specific JavaScript initialization is required here.


    // --- Initial Load ---
    const postId = getPostIdFromUrl();
    loadPost(postId);

    // Initialize particles.js (copied from script.js, ensure it runs on this page too)
    if (document.getElementById('particles-js')) {
      particlesJS('particles-js', { /* ... particles.js config object ... */
        "particles": { "number": { "value": 80, "density": { "enable": true, "value_area": 800 } }, "color": { "value": "#007bff" }, "shape": { "type": "circle", "stroke": { "width": 0, "color": "#000000" }, "polygon": { "nb_sides": 5 }, "image": { "src": "img/github.svg", "width": 100, "height": 100 } }, "opacity": { "value": 0.5, "random": false, "anim": { "enable": false, "speed": 1, "opacity_min": 0.1, "sync": false } }, "size": { "value": 3, "random": true, "anim": { "enable": false, "speed": 40, "size_min": 0.1, "sync": false } }, "line_linked": { "enable": true, "distance": 150, "color": "#007bff", "opacity": 0.4, "width": 1 }, "move": { "enable": true, "speed": 4, "direction": "none", "random": false, "straight": false, "out_mode": "out", "bounce": false, "attract": { "enable": false, "rotateX": 600, "rotateY": 1200 } } }, "interactivity": { "detect_on": "canvas", "events": { "onhover": { "enable": true, "mode": "repulse" }, "onclick": { "enable": true, "mode": "push" }, "resize": true }, "modes": { "grab": { "distance": 400, "line_linked": { "opacity": 1 } }, "bubble": { "distance": 400, "size": 40, "duration": 2, "opacity": 8, "speed": 3 }, "repulse": { "distance": 100, "duration": 0.4 }, "push": { "particles_nb": 4 }, "remove": { "particles_nb": 2 } } }, "retina_detect": true
      });
      console.log("Particles.js 已初始化！(post.js)");
    }

    console.log("文章页面脚本 (post.js) 已加载！");
});