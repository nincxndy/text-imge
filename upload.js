import { db, collection, addDoc, onSnapshot, query, orderBy } from './firebase-config.js';

const form = document.getElementById('upload-form');
const submitBtn = document.getElementById('submit-btn');

const IMGBB_API_KEY = "628e1113e4408b61ff032fbc46990b58"; 

// Tab Control Elements
const tabUploadBtn = document.getElementById('tab-upload-btn');
const tabViewBtn = document.getElementById('tab-view-btn');
const uploadTab = document.getElementById('upload-tab');
const viewTab = document.getElementById('view-tab');
const wishesList = document.getElementById('wishes-list');

// สลับแท็บ
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

// ดึงข้อมูล Real-time + เรียงลำดับจากใหม่ล่าสุดไปเก่าสุด
function listenToWishes() {
  const wishesRef = collection(db, "wishes");
  // ใส่ query เรียงลำดับcreatedAt แบบจัดจากมากไปน้อย (desc = ใหม่สุดขึ้นก่อน)
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

      const sender = item.senderName || "ไม่ระบุชื่อ";
      const message = item.message || "";
      const imageUrl = item.imageUrl || "";

      card.innerHTML = `
        <div class="sender">👤 ${sender}</div>
        ${message ? `<div class="msg">${message}</div>` : ''}
        ${imageUrl ? `<img src="${imageUrl}" alt="ภาพอวยพรจาก ${sender}">` : ''}
      `;

      wishesList.appendChild(card);
    });
  }, (error) => {
    console.error("Firebase Snapshot Error:", error);
    wishesList.innerHTML = '<p style="text-align:center; color:#ff6b6b;">โหลดข้อมูลไม่สำเร็จ</p>';
  });
}

listenToWishes();

// จัดการการบันทึกข้อมูล
form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const nameInput = document.getElementById('user-name');
  const messageInput = document.getElementById('user-message');
  const fileInput = document.getElementById('user-image');

  const senderName = nameInput.value.trim() || "ไม่ระบุชื่อ";
  const message = messageInput.value.trim();
  const file = fileInput.files[0];

  if (!message && !file) {
    alert("กรุณาพิมพ์ข้อความ หรืออัปโหลดรูปภาพอย่างน้อย 1 อย่างครับ");
    return;
  }

  submitBtn.disabled = true;
  submitBtn.innerText = "กำลังอัปโหลดและบันทึกข้อมูล...";

  let imageUrl = "";

  try {
    if (file) {
      const formData = new FormData();
      formData.append("image", file);

      const imgbbResponse = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
        method: "POST",
        body: formData
      });

      const imgbbData = await imgbbResponse.json();
      
      if (imgbbData.success) {
        imageUrl = imgbbData.data.url; 
      } else {
        throw new Error("อัปโหลดรูปลง Imgbb ไม่สำเร็จ");
      }
    }

    await addDoc(collection(db, "wishes"), {
      senderName: senderName,
      message: message,
      imageUrl: imageUrl,
      createdAt: new Date()
    });

    alert("ส่งข้อมูลเรียบร้อยแล้ว!");
    form.reset();
    
    // เด้งไปแท็บดูรายการทันที ซึ่งโพสต์ใหม่ล่าสุดจะขึ้นอยู่อันแรกสุด
    tabViewBtn.click();
  } catch (error) {
    console.error("Error uploading data:", error);
    alert("เกิดข้อผิดพลาด: " + error.message);
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerText = "ส่งข้อมูล";
  }
});
