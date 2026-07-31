import { db, collection, addDoc } from './firebase-config.js';

const form = document.getElementById('upload-form');
const submitBtn = document.getElementById('submit-btn');

// ใส่ Imgbb API Key ของคุณเรียบร้อยแล้ว
const IMGBB_API_KEY = "628e1113e4408b61ff032fbc46990b58"; 

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
    // 1. ถ้ามีไฟล์รูปภาพ ให้อัปโหลดไปที่ Imgbb
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

    // 2. บันทึกข้อมูลเข้า Firebase Firestore
    await addDoc(collection(db, "wishes"), {
      senderName: senderName,
      message: message,
      imageUrl: imageUrl,
      createdAt: new Date()
    });

    alert("ส่งข้อมูลเรียบร้อยแล้ว!");
    form.reset();
  } catch (error) {
    console.error("Error uploading data:", error);
    alert("เกิดข้อผิดพลาด: " + error.message);
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerText = "ส่งข้อมูล";
  }
});
