import { db, collection, addDoc, onSnapshot, query, orderBy } from './firebase-config.js';

const form = document.getElementById('upload-form');
const submitBtn = document.getElementById('submit-btn');
const cdBtn = document.getElementById('cd-btn'); // ปุ่มไปหน้าเคาท์ดาวน์

const IMGBB_API_KEY = "628e1113e4408b61ff032fbc46990b58"; 
const COUNTDOWN_URL = "https://nincxndy.github.io/NY2027/";

// 1. เพิ่ม Event ให้ปุ่มกดข้ามไปหน้าเคาท์ดาวน์ได้ทันทีโดยไม่ต้องกรอกฟอร์ม
if (cdBtn) {
  cdBtn.addEventListener('click', (e) => {
    // ป้องกันไม่ให้ปุ่มไปสั่ง Submit ฟอร์มหากอยู่ในแท็ก <form>
    e.preventDefault(); 
    window.location.href = COUNTDOWN_URL;
  });
}

// 2. ระบบจัดการสลับแท็บ (ถ้าใช้งาน)
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

// 3. ดึงข้อมูลรายการทั้งหมดมาแสดง
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

      const sender = item.senderName || "";
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

// 4. ระบบส่งข้อมูลฟอร์ม และเด้งไปหน้า Countdown เมื่อส่งเสร็จ
if (form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const nameInput = document.getElementById('user-name');
    const messageInput = document.getElementById('user-message');
    const fileInput = document.getElementById('user-image');

    const senderName = nameInput.value.trim() || "";
    const message = messageInput.value.trim();
    const file = fileInput ? fileInput.files[0] : null;

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
      
      // เด้งไปยังหน้า Countdown ทันที
      window.location.href = COUNTDOWN_URL;

    } catch (error) {
      console.error("Error uploading data:", error);
      alert("เกิดข้อผิดพลาด: " + error.message);
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerText = "ส่งข้อมูล";
    }
  });
}
