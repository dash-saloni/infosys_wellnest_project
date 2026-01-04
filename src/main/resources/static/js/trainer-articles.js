const ARTICLE_API = 'http://localhost:8081/api/articles';
const BLOG_API = 'http://localhost:8081/api/blog';

document.addEventListener('DOMContentLoaded', () => {
    // Auth Check
    const role = localStorage.getItem('role');
    if (role !== 'TRAINER') {
        alert("Access Denied");
        window.location.href = 'index.html';
        return;
    }

    // Check URL Param for View
    const urlParams = new URLSearchParams(window.location.search);
    const view = urlParams.get('view');

    // Dynamic Back Button & Tab Visibility
    const backBtn = document.getElementById('backBtn');
    const mainTabs = document.getElementById('mainTabs');

    if (view === 'my_articles') {
        // PROFILE VIEW: Show Back, Hide Tabs, Show My Articles
        if (backBtn) {
            backBtn.innerText = "← Back";
            backBtn.href = "javascript:history.back()";
            backBtn.style.display = 'inline-block';
        }
        if (mainTabs) mainTabs.style.display = 'none';

        switchTab('my-articles');
    } else {
        // DASHBOARD VIEW: Hide Back (default), Show Tabs, Default to All Articles
        if (backBtn) backBtn.style.display = 'none';
        if (mainTabs) mainTabs.style.display = 'flex'; // Ensure tabs are visible

        // Default Tab -> All Articles
        switchTab('all-articles');
    }

    setupEventListeners();
});

function setupEventListeners() {
    document.getElementById('logoutBtn') && document.getElementById('logoutBtn').addEventListener('click', () => {
        localStorage.clear();
        window.location.href = 'login.html';
    });
}

function switchTab(tabName) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.view-section').forEach(v => v.style.display = 'none');

    if (tabName === 'my-articles') {
        // Special case for Profile View (no tab element to activate in main list)
        document.getElementById('my-articles-view').style.display = 'block';
        loadMyArticles();
    } else if (tabName === 'community') {
        document.getElementById('tab-community').classList.add('active');
        document.getElementById('community-view').style.display = 'block';
        loadCommunityHybrid(); // Load both
    } else if (tabName === 'user-posts') {
        document.getElementById('tab-user-posts').classList.add('active');
        document.getElementById('user-posts-view').style.display = 'block';
        loadUserPostsOnly();
    } else {
        // Default: All Articles
        document.getElementById('tab-all-articles').classList.add('active');
        document.getElementById('all-articles-view').style.display = 'block';
        loadAllArticles();
    }
}

// --- CRUD: My Articles (Uses ARTICLE_API) ---

async function loadMyArticles() {
    const grid = document.getElementById('myArticlesGrid');
    grid.innerHTML = '<p>Loading...</p>';
    const email = localStorage.getItem('userEmail');

    try {
        const res = await fetch(`${ARTICLE_API}/my-articles?email=${email}&_t=${new Date().getTime()}`);
        if (!res.ok) throw new Error("Failed to load");
        const posts = await res.json();

        renderArticles(posts, grid, true); // true = owner (Can Edit/Delete)

    } catch (e) {
        console.error("Error in loadMyArticles:", e);
        grid.innerHTML = '<p>Error loading articles.</p>';
    }
}

// Exposed globally for button onclick
async function submitArticle() {
    console.log("submitArticle() called");

    const id = document.getElementById('articleId').value;
    const isEdit = !!id;

    const title = document.getElementById('artTitle').value;
    const description = document.getElementById('artDesc').value;
    const specialization = document.getElementById('artCategory').value;
    const fileInput = document.getElementById('artImage');
    // trainerEmail is likely from localStorage? Or not needed for edit?
    // checking openCreateModal... it uses localStorage.getItem('userEmail') probably?
    // Let's get it safely.
    const trainerEmail = localStorage.getItem('userEmail');

    // If ID exists, it's an EDIT (POST to /update), otherwise CREATE (POST)
    // We use POST for updates too because multipart/PUT often has parsing issues
    const method = 'POST';
    const url = isEdit ? `${ARTICLE_API}/update/${id}` : ARTICLE_API;

    try {
        const formData = new FormData();
        formData.append('title', title);
        formData.append('description', description);
        formData.append('specialization', specialization);
        if (!isEdit) {
            // Only require trainerEmail on create, but backend might ignore it on edit anyway
            formData.append('trainerEmail', trainerEmail);
        }

        if (fileInput.files.length > 0) {
            formData.append('image', fileInput.files[0]);
        }

        console.log(`Sending ${method} Payload to ${url}...`, { title, description, specialization });

        const res = await fetch(url, {
            method: method,
            body: formData
        });

        if (res.ok) {
            const txt = await res.text();
            console.log("Success response:", txt);
            alert(isEdit ? "Article Updated Successfully!" : "Article Successfully Saved!");
            closeModal();
            loadMyArticles();
        } else {
            const err = await res.text();
            console.error("Server Error:", res.status, err);
            alert("Failed to Save: Server returned " + res.status + "\n" + err);
        }
    } catch (e) {
        console.error("Network/Script Error:", e);
        alert("Unexpected Error: " + e.message + "\nCheck console for details.");
    }
}

// Implement Edit Function
async function editArticle(id) {
    console.log("Edit Article:", id);
    try {
        const res = await fetch(`${ARTICLE_API}/${id}`);
        if (!res.ok) throw new Error("Failed to fetch article details");
        const article = await res.json();

        // Populate Modal
        document.getElementById('articleId').value = article.id || '';
        document.getElementById('artTitle').value = article.title || '';
        document.getElementById('artDesc').value = article.description || '';
        document.getElementById('artCategory').value = article.specialization || 'General';
        document.getElementById('modalTitle').innerText = "Edit Article";

        // Show Modal
        document.getElementById('articleModal').style.display = 'block';

    } catch (e) {
        console.error(e);
        alert("Error loading article for edit.");
    }
}


async function deleteArticle(id) {
    if (!confirm("Are you sure you want to delete this article?")) return;

    try {
        await fetch(`${ARTICLE_API}/${id}`, { method: 'DELETE' });
        loadMyArticles();
    } catch (e) {
        alert("Delete failed");
    }
}

function editArticle(id) {
    // Fetch all to find one
    // FIX: Use ARTICLE_API instead of API_URL
    fetch(`${ARTICLE_API}/my-articles?email=${localStorage.getItem('userEmail')}`)
        .then(r => r.json())
        .then(posts => {
            const p = posts.find(x => x.id === id);
            if (p) {
                document.getElementById('articleId').value = p.id;
                document.getElementById('artTitle').value = p.title;
                document.getElementById('artDesc').value = p.description;
                document.getElementById('artCategory').value = p.specialization;
                document.getElementById('modalTitle').innerText = "Edit Article";
                document.getElementById('articleModal').style.display = 'flex';
            }
        });
}

function openCreateModal() {
    document.getElementById('articleForm').reset();
    document.getElementById('articleId').value = '';
    document.getElementById('modalTitle').innerText = "Create Article";
    document.getElementById('articleModal').style.display = 'flex';
}

function closeModal() {
    document.getElementById('articleModal').style.display = 'none';
}

// --- Client Posts Feed (Uses BLOG_API) ---


// --- All Articles (Uses ARTICLE_API) ---
async function loadAllArticles() {
    const grid = document.getElementById('allArticlesGrid');
    grid.innerHTML = '<p>Loading...</p>';

    try {
        const res = await fetch(ARTICLE_API); // Fetch all
        const posts = await res.json();

        renderArticles(posts, grid, false); // false = no edit/delete buttons
    } catch (e) {
        grid.innerHTML = '<p>Error loading articles.</p>';
    }
}

// --- Community/Client Posts (Uses BLOG_API) ---
// --- Community Hybrid (Two Grids) ---
async function loadCommunityHybrid() {
    // 1. Load User Posts into Top Grid
    const userGrid = document.getElementById('communityGridUser');
    userGrid.innerHTML = '<p>Loading user posts...</p>';
    fetchUserPosts(userGrid, 'comm');

    // 2. Load Trainer Articles into Bottom Grid
    const trainerGrid = document.getElementById('communityGridTrainer');
    trainerGrid.innerHTML = '<p>Loading articles...</p>';
    fetchArticles(trainerGrid);
}

// --- User Posts Only Tab ---
async function loadUserPostsOnly() {
    const grid = document.getElementById('userPostsGrid');
    grid.innerHTML = '<p>Loading...</p>';
    fetchUserPosts(grid, 'user');
}

// --- Shared Fetchers ---

async function fetchArticles(gridElement) {
    try {
        const res = await fetch(ARTICLE_API);
        const posts = await res.json();
        renderArticles(posts, gridElement, false);
    } catch (e) {
        gridElement.innerHTML = '<p>Error loading articles.</p>';
    }
}

async function fetchUserPosts(gridElement, prefix) {
    try {
        const res = await fetch(`${BLOG_API}?type=USER_POST`);
        const posts = await res.json();

        gridElement.innerHTML = '';
        if (posts.length === 0) {
            gridElement.innerHTML = '<p style="color:#aaa;">No user posts found.</p>';
            return;
        }

        posts.forEach(post => {
            const card = document.createElement('div');
            card.className = 'article-card';

            // Shared Logic Setup
            const currentUserEmail = localStorage.getItem('userEmail');
            let isLiked = false;
            if (post.likedBy && Array.isArray(post.likedBy) && currentUserEmail) {
                isLiked = post.likedBy.some(u => u.email === currentUserEmail);
            }
            const commentsCount = post.comments ? post.comments.length : 0;
            const likesCount = post.likesCount || 0;

            // Icons
            const heartIcon = `<svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>`;
            const commentIcon = `<svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>`;
            const shareIcon = `<svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z"/></svg>`;

            // Setup data for View (Matching blog.js logic)
            // Log for debugging
            console.log("Rendering Post:", post.id, "Author:", post.author);
            const authorName = post.author ? (post.author.fullName || post.author.email || 'Anonymous') : 'Anonymous';
            const avatarLetter = authorName.charAt(0).toUpperCase();
            const date = new Date(post.createdAt).toLocaleDateString();
            const category = post.category || 'Post';
            const badgeColor = '#18b046'; // User posts green

            card.innerHTML = `
                ${post.imageUrl ? `<img src="${post.imageUrl}" class="article-img">` : ''}
                
                <div class="article-content-wrapper">
                    <div class="post-meta">
                        <div class="post-avatar" style="border-color:${badgeColor}">${avatarLetter}</div>
                        <span class="post-author" style="font-weight:bold; color:#fff;">${authorName}</span>
                        <span>•</span>
                        <span class="post-category" style="color:${badgeColor}; background:rgba(255,255,255,0.1);">${category}</span>
                        <span>•</span>
                        <span>${date}</span>
                    </div>

                    <div class="article-title" style="font-size:20px; margin-bottom:10px;">${post.title}</div>
                    <div class="article-desc" style="color:#ddd; margin-bottom:20px;">${post.content}</div>
                    
                    <div class="post-actions">
                         <button class="action-btn ${isLiked ? 'liked' : ''}" onclick="likePost(${post.id}, 'POST', this)">
                            ${heartIcon} <span style="font-weight:bold;">${likesCount}</span>
                         </button>
                         <button class="action-btn" onclick="toggleComments(${post.id}, '${prefix}')" style="white-space:nowrap;">
                            ${commentIcon} <span style="font-weight:bold;">${commentsCount}</span>
                         </button>
                         <button class="action-btn share-btn" onclick="shareArticle(${post.id})">
                            ${shareIcon}
                         </button>
                    </div>

                    <!-- Inline Comment Section -->
                    <div id="comments-${prefix}-${post.id}" class="comments-section">
                        <h4 style="margin-bottom:10px; font-size:14px; color:#aaa;">Discussion</h4>
                        <div class="comments-list" id="comments-list-${prefix}-${post.id}" style="display:flex; flex-direction:column; gap:8px; max-height:200px; overflow-y:auto; margin-bottom:10px;">
                            ${post.comments ? post.comments.map(c => `
                                <div class="comment-card" style="padding:8px; background:rgba(0,0,0,0.3); border-radius:6px; position:relative;">
                                    <div style="font-size:12px; font-weight:bold; color:#fff;">${c.author ? (c.author.fullName || c.author.email || 'User') : 'User'}</div>
                                    <div style="font-size:13px; color:#ccc;">${c.content}</div>
                                    ${(c.author && c.author.email === currentUserEmail) ?
                    `<button onclick="deleteCommentById(${c.id}, ${post.id}, '${prefix}')" style="position:absolute; right:5px; top:5px; background:none; border:none; color:#d32f2f; cursor:pointer; font-size:10px;">✖</button>`
                    : ''}
                                </div>
                            `).join('') : '<p style="font-size:12px; color:#666;">No comments yet.</p>'}
                        </div>
                        
                        <div style="display:flex; gap:5px;">
                            <input type="text" id="comment-input-${prefix}-${post.id}" placeholder="Type a comment..." style="flex:1; padding:6px; border-radius:4px; border:none; background:#222; color:#fff; font-size:13px;">
                            <button onclick="submitComment(${post.id}, 'POST', '${prefix}')" style="background:#18b046; color:#fff; border:none; padding:0 12px; border-radius:4px; font-size:12px; cursor:pointer;">Post</button>
                        </div>
                    </div>
                </div>
            `;
            gridElement.appendChild(card);
        });
    } catch (e) {
        console.error(e);
        gridElement.innerHTML = '<p>Error loading feed.</p>';
    }
}

async function deleteCommentById(commentId, postId, prefix) {
    if (!confirm("Delete this comment?")) return;
    const userEmail = localStorage.getItem('userEmail');
    try {
        const res = await fetch(`http://localhost:8081/api/comments/${commentId}?userEmail=${userEmail}`, { method: 'DELETE' });
        if (res.ok) {
            // Remove from UI
            // Ideally we reload, but for now we can just find and remove the element
            // Or reload just that post. For simplicity, let's reload the feed.
            // Or simpler: reloadCommunityHybrid() or fetchUserPosts(grid).
            // Since we don't have easy access to the exact Grid element here easily without passing it, 
            // let's just reload the page or the specific list if we can find it.
            // Actually, re-fetching the feed is safest.
            const userGrid = document.getElementById(prefix === 'comm' ? 'communityGridUser' : 'userPostsGrid');
            if (userGrid) fetchUserPosts(userGrid, prefix);
        } else {
            alert("Failed to delete comment");
        }
    } catch (e) { console.error(e); }
}

async function likePost(id, btn) {
    try {
        const res = await fetch(`${BLOG_API}/${id}/like`, { method: 'POST' });
        if (res.ok) {
            const count = await res.json();
            btn.innerText = `♥ ${count} Like`;
            btn.style.color = '#18b046';
        }
    } catch (e) { console.error(e); }
}

// Helper to render Article Cards
function renderArticles(posts, grid, isOwner) {
    grid.innerHTML = '';
    if (posts.length === 0) {
        grid.innerHTML = '<p style="color:#aaa;">No articles found.</p>';
        return;
    }

    posts.forEach(post => {
        const card = document.createElement('div');
        card.className = 'article-card';
        const imgUrl = post.imageUrl ? post.imageUrl : 'https://via.placeholder.com/300?text=Article';

        // Truncate Description
        const shortDesc = post.description && post.description.length > 100
            ? post.description.substring(0, 100) + '...'
            : post.description;

        let ownerActions = '';
        if (isOwner) {
            ownerActions = `
                <button class="btn-sm btn-edit" onclick="editArticle(${post.id})">Edit</button>
                <button class="btn-sm btn-delete" onclick="deleteArticle(${post.id})">Delete</button>
            `;
        } else {
            ownerActions = `<span style="font-size:12px; color:#aaa;">By ${post.trainerName || 'Trainer'}</span>`;
        }

        // Icons
        const heartIcon = `<svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>`;
        const commentIcon = `<svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>`;
        const shareIcon = `<svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z"/></svg>`;

        // Check Like Status
        const currentUserEmail = localStorage.getItem('userEmail');
        let isLiked = false;
        if (post.likedBy && Array.isArray(post.likedBy) && currentUserEmail) {
            isLiked = post.likedBy.some(u => u.email === currentUserEmail);
        }

        const commentsCount = post.comments ? post.comments.length : 0;

        // Setup for Expert Articles (Trainer)
        const authorName = post.trainerName || 'Trainer';
        const avatarLetter = authorName.charAt(0).toUpperCase();
        const date = new Date(post.createdAt || Date.now()).toLocaleDateString();
        const badgeColor = '#ff9800';
        const prefix = 'article';

        // Comments Generation
        const commentsHtml = (post.comments || []).map(c => `
            <div class="comment-card" style="padding:8px; background:rgba(0,0,0,0.3); border-radius:6px; position:relative;">
                <div style="font-size:12px; font-weight:bold; color:#fff;">
                    ${c.author ? (c.author.fullName || c.author.email || 'User') : 'User'}
                    <span style="font-size:10px; color:#aaa; margin-left:4px; font-weight:normal;">(${c.author && c.author.role ? c.author.role : 'USER'})</span>
                </div>
                <div style="font-size:13px; color:#ccc;">${c.content}</div>
                ${(c.author && c.author.email === currentUserEmail) ?
                `<button onclick="deleteCommentById(${c.id}, ${post.id}, '${prefix}')" style="position:absolute; right:5px; top:5px; background:none; border:none; color:#d32f2f; cursor:pointer; font-size:10px;">✖</button>`
                : ''}
            </div>
        `).join('') || '<p style="font-size:12px; color:#666;">No comments yet.</p>';

        card.innerHTML = `
            ${post.imageUrl ? `<img src="${post.imageUrl}" class="article-img">` : `<img src="https://via.placeholder.com/300?text=Article" class="article-img">`}
            
            <div class="article-content-wrapper">
                <div class="post-meta">
                    <div class="post-avatar" style="border-color:${badgeColor}">${avatarLetter}</div>
                    <span class="post-author" style="font-weight:bold; color:#fff;">${authorName}</span>
                    <span>•</span>
                    <span class="post-category" style="color:${badgeColor}; background:rgba(255,255,255,0.1);">${post.specialization}</span>
                    <span>•</span>
                    <span>${date}</span>
                </div>

                <div class="article-title" style="font-size:20px; margin-bottom:10px;">${post.title}</div>
                <div class="article-desc" style="color:#ddd; margin-bottom:20px;">${post.description}</div> <!-- Using full description -->

                <div class="post-actions">
                     <button class="action-btn ${isLiked ? 'liked' : ''}" onclick="likePost(${post.id}, 'ARTICLE', this)">
                        ${heartIcon} <span style="font-weight:bold;">${post.likesCount || 0}</span>
                     </button>
                     <button class="action-btn" onclick="toggleComments(${post.id}, '${prefix}')" style="white-space:nowrap;">
                        ${commentIcon} <span style="font-weight:bold;">${commentsCount}</span>
                     </button>
                     <button class="action-btn share-btn" onclick="shareArticle(${post.id})">
                        ${shareIcon}
                     </button>
                     <a href="article-details.html?id=${post.id}" style="margin-left:auto; color:#18b046; font-size:12px; text-decoration:none; border:1px solid #18b046; padding:6px 12px; border-radius:20px; white-space:nowrap;">Read More →</a>
                </div>

                <!-- Inline Comment Section -->
                <div id="comments-${prefix}-${post.id}" class="comments-section">
                    <h4 style="margin-bottom:10px; font-size:14px; color:#aaa;">Discussion</h4>
                    <div class="comments-list" id="comments-list-${prefix}-${post.id}" style="display:flex; flex-direction:column; gap:8px; max-height:200px; overflow-y:auto; margin-bottom:10px;">
                        ${commentsHtml}
                    </div>
                    
                    <div style="display:flex; gap:5px;">
                        <input type="text" id="comment-input-${prefix}-${post.id}" placeholder="Type a comment..." style="flex:1; padding:6px; border-radius:4px; border:none; background:#222; color:#fff; font-size:13px;">
                        <button onclick="submitComment(${post.id}, 'ARTICLE', '${prefix}')" style="background:#18b046; color:#fff; border:none; padding:0 12px; border-radius:4px; font-size:12px; cursor:pointer;">Post</button>
                    </div>
                </div>
                
                ${isOwner ? `<div style="margin-top:10px; border-top:1px solid rgba(255,255,255,0.1); padding-top:10px; text-align:right;">${ownerActions}</div>` : ''}
            </div>
        `;
        grid.appendChild(card);
    });
}

// --- Social Actions ---

// Toggles inline comments
function toggleComments(id, prefix) {
    const el = document.getElementById(`comments-${prefix}-${id}`);
    if (el.style.display === 'none') el.style.display = 'block';
    else el.style.display = 'none';
}

// Submits a comment (for User Posts mainly)
async function submitComment(id, type, prefix) {
    const userEmail = localStorage.getItem('userEmail');
    if (!userEmail) { alert("Login required"); return; }

    const input = document.getElementById(`comment-input-${prefix}-${id}`);
    const content = input.value.trim();
    if (!content) return;

    // Determine URL based on Type
    // Note: BLOG_API is for User Posts
    const url = (type === 'ARTICLE') ? `${ARTICLE_API}/${id}/comment` : `${BLOG_API}/${id}/comment`;

    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content, userEmail })
        });

        if (res.ok) {
            const comment = await res.json();
            // Add to UI
            const list = document.getElementById(`comments-list-${prefix}-${id}`);
            const div = document.createElement('div');
            div.className = 'comment-card';
            div.style.cssText = "padding:8px; background:rgba(0,0,0,0.3); border-radius:6px; margin-top:5px;";
            div.innerHTML = `
                <div style="font-size:12px; font-weight:bold; color:#fff;">
                    ${comment.author ? (comment.author.fullName || comment.author.email || 'User') : 'You'}
                    <span style="font-size:10px; color:#aaa; margin-left:4px; font-weight:normal;">(${comment.author && comment.author.role ? comment.author.role : 'USER'})</span>
                </div>
                <div style="font-size:13px; color:#ccc;">${comment.content}</div>
            `;
            list.appendChild(div);
            // Clear input
            input.value = '';
        } else {
            alert("Comment failed");
        }
    } catch (e) { console.error(e); }
}

async function likePost(id, type, btn) {
    const userEmail = localStorage.getItem('userEmail');
    if (!userEmail) return;

    try {
        // Determine URL
        let url = (type === 'ARTICLE') ? `${ARTICLE_API}/${id}/like?userEmail=${userEmail}` : `${BLOG_API}/${id}/like?userEmail=${userEmail}`;

        const res = await fetch(url, { method: 'POST' });
        if (res.ok) {
            const data = await res.json();
            // Update count inside span
            const span = btn.querySelector('span');
            if (span) span.innerText = data.likesCount;

            // Toggle class
            if (data.liked) btn.classList.add('liked');
            else btn.classList.remove('liked');
        }
    } catch (e) { console.error(e); }
}

function shareArticle(id) {
    const url = `${window.location.origin}/article-details.html?id=${id}`;
    navigator.clipboard.writeText(url).then(() => {
        alert("Link copied to clipboard!");
    });
}

