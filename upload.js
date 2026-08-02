import { db, collection, addDoc, onSnapshot, query, orderBy } from './firebase-config.js';

const form = document.getElementById('upload-form');
const submitBtn = document.getElementById('submit-btn');
const cdBtn = document.getElementById('cd-btn');

const CLOUDINARY_CLOUD_NAME = "op4q4mqx"; 
const CLOUDINARY_PRESET = "ml_default"; 
const COUNTDOWN_URL = "https://nincxndy.github.io/NY2027/";

if (cdBtn) {
  cdBtn.addEventListener('click', (e) => {
    e.preventDefault(); 
    window.location.href = COUNTDOWN_URL;
  });
}

const tabUploadBtn = document.getElementById('tab-upload-btn');
const tabViewBtn = document.getElementById('tab-view-btn');
const uploadTab = document.getElementById('upload-tab');
const viewTab = document.getElementById('view-tab');
const wishesList = document.getElementById('wishes-list');

if (tabUploadBtn && tabViewBtn) {
  tabUploadBtn.addEventListener('click', () => {
    tabUploadBtn.classList.add('active');
    tabViewBtn.classList.remove('active');
    uploadTab.classList.add('active');
    viewTab.classList.remove('active');
  });

  tabViewBtn.addEventListener('click', () => {
    tabViewBtn.classList.add('active');
    tabUploadBtn.classList.remove('active');
    viewTab.classList.add('active');
    uploadTab.classList.remove('active');
  });
}

function listenToWishes() {
  if (!wishesList) return;
  
  const wishesRef = collection(db, "wishes");
  const q = query(wishesRef, orderBy("createdAt", "desc"));

  onSnapshot(q, (snapshot) => {
    wishesList.innerHTML = "";

    if (snapshot.empty) {
      wishesList.innerHTML = '<p style="text-align:center; color:#aaa;">ยังไม่มีข้อความอวยพรในขณะนี้</p>';
      return;
    }

    snapshot.forEach((doc) => {
      const item = doc.data();
      const card = document.createElement('div');
      card.className = 'wish-item';

      const sender = item.senderName ? item.senderName.trim() : "";
      const message = item.message || "";
      const mediaUrl = item.mediaUrl || item.imageUrl || ""; 
      const mediaType = item.mediaType || "image";

      let mediaHtml = "";
      if (mediaUrl) {
        if (mediaType === "video") {
          mediaHtml = `<video src="${mediaUrl}" controls playsinline></video>`;
        } else {
          mediaHtml = `<img src="${mediaUrl}" alt="ภาพอวยพร">`;
        }
      }

      const senderHtml = sender ? `<div class="sender">${sender}</div>` : "";
      const messageHtml = message ? `<div class="msg">${message}</div>` : "";

      card.innerHTML = `
        ${senderHtml}
        ${messageHtml}
        ${mediaHtml}
      `;

      wishesList.appendChild(card);
    });
  }, (error) => {
    console.error("Firebase Snapshot Error:", error);
    wishesList.innerHTML = '<p style="text-align:center; color:#ff6b6b;">โหลดข้อมูลไม่สำเร็จ</p>';
  });
}

listenToWishes();

if (form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const nameInput = document.getElementById('user-name');
    const messageInput = document.getElementById('user-message');
    const mediaInput = document.getElementById('user-media');

    const senderName = nameInput ? nameInput.value.trim() : "";
    const message = messageInput ? messageInput.value.trim() : "";
    const file = mediaInput && mediaInput.files ? mediaInput.files[0] : null;

    if (!message && !file) {
      alert("กรุณาพิมพ์ข้อความ หรืออัปโหลดรูปภาพ/วิดีโอ อย่างน้อย 1 อย่างครับ");
      return;
    }

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerText = "กำลังอัปโหลดและบันทึกข้อมูล...";
    }

    let mediaUrl = "";
    let mediaType = "";

    try {
      if (file) {
        if (file.type.startsWith('video/')) {
          mediaType = 'video';
        } else if (file.type.startsWith('image/')) {
          mediaType = 'image';
        }

        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", CLOUDINARY_PRESET);

        const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`, {
          method: "POST",
          body: formData
        });

        const uploadData = await uploadRes.json();

        if (!uploadRes.ok) {
          throw new Error(uploadData.error?.message || "อัปโหลดไฟล์ไป Cloudinary ไม่สำเร็จ");
        }

        mediaUrl = uploadData.secure_url;
      }

      await addDoc(collection(db, "wishes"), {
        senderName: senderName,
        message: message,
        mediaUrl: mediaUrl,
        mediaType: mediaType,
        createdAt: new Date()
      });

      alert("ส่งข้อมูลเรียบร้อยแล้ว!");
      form.reset();
      window.location.href = COUNTDOWN_URL;

    } catch (error) {
      console.error("Error uploading data:", error);
      alert("เกิดข้อผิดพลาด: " + error.message);
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerText = "ส่งข้อมูล";
      }
    }
  });
}
