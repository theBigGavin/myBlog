// Initialize particles.js
if (document.getElementById('particles-js')) {
  particlesJS('particles-js', {
    "particles": {
      "number": {
        "value": 80, // 粒子数量
        "density": {
          "enable": true,
          "value_area": 800 // 粒子分布区域密度
        }
      },
      "color": {
        "value": "#8800FF" // 紫色粒子
      },
      "shape": {
        "type": "circle", // 粒子形状
        "stroke": {
          "width": 0,
          "color": "#000000"
        },
        "polygon": {
          "nb_sides": 5
        },
        "image": {
          "src": "img/github.svg",
          "width": 100,
          "height": 100
        }
      },
      "opacity": {
        "value": 0.5, // 粒子透明度
        "random": false,
        "anim": {
          "enable": false,
          "speed": 1,
          "opacity_min": 0.1,
          "sync": false
        }
      },
      "size": {
        "value": 3, // 粒子大小
        "random": true,
        "anim": {
          "enable": false,
          "speed": 40,
          "size_min": 0.1,
          "sync": false
        }
      },
      "line_linked": {
        "enable": true,
        "distance": 150, // 粒子连接线距离
        "color": "#8800FF", // 紫色连接线
        "opacity": 0.4,
        "width": 1
      },
      "move": {
        "enable": true,
        "speed": 4, // 粒子移动速度
        "direction": "none",
        "random": false,
        "straight": false,
        "out_mode": "out",
        "bounce": false,
        "attract": {
          "enable": false,
          "rotateX": 600,
          "rotateY": 1200
        }
      }
    },
    "interactivity": {
      "detect_on": "canvas",
      "events": {
        "onhover": {
          "enable": true, // 鼠标悬停交互
          "mode": "repulse" // 悬停时排斥粒子
        },
        "onclick": {
          "enable": true, // 鼠标点击交互
          "mode": "push" // 点击时推送粒子
        },
        "resize": true
      },
      "modes": {
        "grab": {
          "distance": 400,
          "line_linked": {
            "opacity": 1
          }
        },
        "bubble": {
          "distance": 400,
          "size": 40,
          "duration": 2,
          "opacity": 8,
          "speed": 3
        },
        "repulse": {
          "distance": 100, // 悬停排斥距离
          "duration": 0.4
        },
        "push": {
          "particles_nb": 4 // 点击推送粒子数量
        },
        "remove": {
          "particles_nb": 2
        }
      }
    },
    "retina_detect": true // 启用 Retina 显示支持
  });
  console.log("Particles.js 已初始化！");
} else {
  console.log("未找到 #particles-js 元素，跳过 Particles.js 初始化。");
}


// Function to load blog posts from posts.json
async function loadPosts() {
  const postsContainer = document.getElementById('posts-container');
  // Only run if the posts container exists on the current page
  if (!postsContainer) {
    console.log("未找到 #posts-container 元素，跳过文章加载。");
    return;
  }

  try {
    const response = await fetch('posts.json');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const posts = await response.json();

    // Clear the loading message
    postsContainer.innerHTML = '';

    if (posts.length === 0) {
      postsContainer.innerHTML = '<p>暂无文章。</p>';
      return;
    }

    // Sort posts by date, newest first (optional)
    posts.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Render each post
    posts.forEach(post => {
      const article = document.createElement('article');
      article.setAttribute('data-id', post.id); // Add data-id for potential future use

      const titleHeader = document.createElement('h2');
      const titleLink = document.createElement('a');
      titleLink.href = `post.html?id=${post.id}`;
      titleLink.textContent = post.title;
      // Optional: Add a class for styling the link if needed
      // titleLink.classList.add('post-title-link');
      titleHeader.appendChild(titleLink);

      const meta = document.createElement('div');
      meta.classList.add('post-meta');
      const datePara = document.createElement('p');
      // Format date for better readability (optional)
      try {
          const dateObj = new Date(post.date);
          // Add timezone offset to interpret date as local
          const adjustedDate = new Date(dateObj.getTime() + dateObj.getTimezoneOffset() * 60000);
          datePara.textContent = `发布日期：${adjustedDate.toLocaleDateString('zh-CN')}`;
      } catch (e) {
          console.warn(`无法解析日期 "${post.date}" for post "${post.title}". 使用原始日期。`);
          datePara.textContent = `发布日期：${post.date}`;
      }
      meta.appendChild(datePara);

      const summary = document.createElement('p');
      summary.textContent = post.summary || '（暂无摘要）'; // Display summary, handle missing

      article.appendChild(titleHeader);
      article.appendChild(meta);
      article.appendChild(summary); // Append summary instead of full content

      postsContainer.appendChild(article);
    });

  } catch (error) {
    console.error('加载文章失败:', error);
    postsContainer.innerHTML = '<p>加载文章时出错，请稍后重试。</p>';
  }
}

// Load posts when the DOM is ready
document.addEventListener('DOMContentLoaded', loadPosts);

console.log("博客脚本已加载！");