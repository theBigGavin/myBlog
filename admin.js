document.addEventListener('DOMContentLoaded', () => {
    const postList = document.getElementById('post-list');
    const addForm = document.getElementById('add-post-form');
    const addTitleInput = document.getElementById('add-title');
    const addContentInput = document.getElementById('add-content');
    const editSection = document.getElementById('edit-post-section');
    const editForm = document.getElementById('edit-post-form');
    const editIdInput = document.getElementById('edit-id');
    const editTitleInput = document.getElementById('edit-title');
    const editContentInput = document.getElementById('edit-content');
    const cancelEditButton = document.getElementById('cancel-edit-button');
    const saveJsonButton = document.getElementById('save-json-button');
    const jsonOutput = document.getElementById('json-output');

    let posts = []; // In-memory store for posts

    // --- Helper Functions ---

    // Generate a simple unique ID (for demo purposes)
    function generateId() {
        return `post-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    }

    // Render the list of posts
    function renderPostList() {
        postList.innerHTML = ''; // Clear existing list
        if (posts.length === 0) {
            postList.innerHTML = '<li>暂无文章。</li>';
            return;
        }
        posts.forEach(post => {
            const li = document.createElement('li');
            li.setAttribute('data-id', post.id);
            li.innerHTML = `
                <span>${post.title} (${post.date})</span>
                <div>
                    <button class="edit-button">编辑</button>
                    <button class="delete-button">删除</button>
                </div>
            `;
            postList.appendChild(li);
        });
    }

    // Show the edit form with post data
    function showEditForm(post) {
        editIdInput.value = post.id;
        editTitleInput.value = post.title;
        editContentInput.value = post.content;
        editSection.style.display = 'block';
        addForm.style.display = 'none'; // Hide add form while editing
        window.scrollTo(0, editSection.offsetTop - 20); // Scroll to edit form
    }

    // Hide the edit form
    function hideEditForm() {
        editSection.style.display = 'none';
        addForm.style.display = 'block'; // Show add form again
        editForm.reset(); // Clear the form
    }

    // Update the JSON output textarea
    function updateJsonOutput() {
        jsonOutput.value = JSON.stringify(posts, null, 2); // Pretty print JSON
    }

    // --- Load Initial Data ---
    async function loadInitialPosts() {
        try {
            const response = await fetch('posts.json');
            if (!response.ok) {
                // If posts.json doesn't exist or is invalid, start with an empty array
                if (response.status === 404) {
                    console.warn('posts.json not found. Starting with empty posts array.');
                    posts = [];
                } else {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
            } else {
                posts = await response.json();
                // Ensure posts is always an array
                if (!Array.isArray(posts)) {
                    console.error('posts.json does not contain a valid JSON array. Resetting to empty.');
                    posts = [];
                }
                 // Sort posts by date, newest first (optional, matches frontend)
                posts.sort((a, b) => new Date(b.date) - new Date(a.date));
            }
            renderPostList();
            updateJsonOutput(); // Show initial JSON
        } catch (error) {
            console.error('加载初始文章失败:', error);
            postList.innerHTML = '<li>加载文章时出错。</li>';
            posts = []; // Start with empty array on error
            updateJsonOutput();
        }
    }

    // --- Event Listeners ---

    // Add Post Form Submission
    addForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const newPost = {
            id: generateId(),
            title: addTitleInput.value.trim(),
            // Get current date in YYYY-MM-DD format
            date: new Date().toISOString().split('T')[0],
            content: addContentInput.value.trim()
        };
        if (newPost.title && newPost.content) {
            posts.unshift(newPost); // Add to the beginning of the array
            renderPostList();
            updateJsonOutput();
            addForm.reset(); // Clear the form
        } else {
            alert('标题和内容不能为空！');
        }
    });

    // Edit/Delete Button Clicks (using event delegation)
    postList.addEventListener('click', (e) => {
        const target = e.target;
        const li = target.closest('li');
        if (!li) return;
        const postId = li.getAttribute('data-id');

        if (target.classList.contains('edit-button')) {
            const postToEdit = posts.find(p => p.id === postId);
            if (postToEdit) {
                showEditForm(postToEdit);
            }
        } else if (target.classList.contains('delete-button')) {
            if (confirm(`确定要删除文章 "${li.querySelector('span').textContent.split('(')[0].trim()}" 吗？`)) {
                posts = posts.filter(p => p.id !== postId);
                renderPostList();
                updateJsonOutput();
                // If the deleted post was being edited, hide the edit form
                if (editIdInput.value === postId) {
                    hideEditForm();
                }
            }
        }
    });

    // Edit Post Form Submission
    editForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const postId = editIdInput.value;
        const updatedTitle = editTitleInput.value.trim();
        const updatedContent = editContentInput.value.trim();

        if (updatedTitle && updatedContent) {
            posts = posts.map(post => {
                if (post.id === postId) {
                    return { ...post, title: updatedTitle, content: updatedContent };
                }
                return post;
            });
            renderPostList();
            updateJsonOutput();
            hideEditForm();
        } else {
            alert('标题和内容不能为空！');
        }
    });

    // Cancel Edit Button
    cancelEditButton.addEventListener('click', hideEditForm);

    // Save JSON Button (just updates the textarea)
    saveJsonButton.addEventListener('click', () => {
        updateJsonOutput();
        // Optionally select the text for easy copying
        jsonOutput.select();
        jsonOutput.setSelectionRange(0, 99999); // For mobile devices
        alert('JSON 数据已更新在文本框中。请手动复制并覆盖 posts.json 文件。');
    });

    // --- Initial Load ---
    loadInitialPosts();

    console.log("后台管理脚本已加载！");
});