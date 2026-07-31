import { db, storage, collection, addDoc, ref, uploadBytes, getDownloadURL } from './firebase-config.js';

const form = document.getElementById('upload-form');
const submitBtn = document.getElementById('submit-btn');

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const messageInput = document.getElementById('user-message');
  const fileInput = document.getElementById('user-image');
  const message = messageInput.value.trim();
  const file = fileInput.files[0];

  // ตรวจสอบว่าผู้ใช้กรอกข้อความหรือเลือกรูปภาพอย่างน้อย 1 อย่างหรือไม่
  if (!message && !file) {
    alert("กรุณาพิมพ์ข้อความ หรือเลือกรูปภาพอย่างน้อย 1 อย่างครับ");
    return;
  }

  submitBtn.disabled = true;
  submitBtn.innerText = "กำลังบันทึกข้อมูล...";

  let imageUrl = "";

  try {
    // 1. ถ้ามีการเลือกรูปภาพ ให้ทำการอัปโหลดไปยัง Firebase Storage
    if (file) {
      const fileName = `uploads/${Date.now()}_${file.name}`;
      const storageRef = ref(storage, fileName);
      await uploadBytes(storageRef, file);
      imageUrl = await getDownloadURL(storageRef);
    }

    // 2. บันทึกข้อมูล (ข้อความ และ/หรือ ลิงก์รูปภาพ) ลงใน Firestore Database
    await addDoc(collection(db, "wishes"), {
      message: message,
      imageUrl: imageUrl,
      createdAt: new Date()
    });

    alert("ส่งข้อมูลเรียบร้อยแล้ว!");
    form.reset();
  } catch (error) {
    console.error("Error uploading data:", error);
    alert("เกิดข้อผิดพลาดในการบันทึกข้อมูล (กรุณาเช็กสิทธิ์ Firebase Rules / CORS)");
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerText = "ส่งข้อมูล";
  }
});