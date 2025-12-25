// إعدادات الربط (المفاتيح الخاصة بك)
const SUPABASE_URL = "https://yfdcehdtflpmjhtdktnz.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlmZGNlaGR0ZmxwbWpodGRrdG56Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ5NTk1NzcsImV4cCI6MjA4MDUzNTU3N30.phWJor_ZGI883-sdcqLf_riySSbkEMmk8kn_RIMzLpI";

const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const fileList = document.getElementById('fileList');
const loader = document.getElementById('uploadLoader');

// تحميل الملفات الموجودة عند البدء
window.onload = fetchFiles;

// تفعيل الضغط والسحب
dropZone.onclick = () => fileInput.click();
fileInput.onchange = (e) => handleUpload(e.target.files);

dropZone.ondragover = (e) => { e.preventDefault(); dropZone.classList.add('active'); };
dropZone.ondragleave = () => dropZone.classList.remove('active');
dropZone.ondrop = (e) => {
    e.preventDefault();
    dropZone.classList.remove('active');
    handleUpload(e.dataTransfer.files);
};

// وظيفة الرفع
async function handleUpload(files) {
    if (files.length === 0) return;
    loader.classList.remove('hidden');

    for (let file of files) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `uploads/${fileName}`;

        const { data, error } = await supabase.storage
            .from('web-craft') // تأكد من وجود Bucket بهذا الاسم
            .upload(filePath, file);

        if (error) alert("خطأ في الرفع: " + error.message);
    }

    loader.classList.add('hidden');
    fetchFiles();
}

// جلب الملفات وعرضها
async function fetchFiles() {
    const { data: files, error } = await supabase.storage
        .from('web-craft')
        .list('uploads', { limit: 20, order: { column: 'created_at', ascending: false } });

    if (error) return;

    fileList.innerHTML = files.map(f => {
        const { data } = supabase.storage.from('web-craft').getPublicUrl(`uploads/${f.name}`);
        return `
            <div class="glass p-4 rounded-2xl flex items-center justify-between group hover:border-blue-500 transition">
                <div class="flex items-center gap-3 overflow-hidden">
                    <div class="p-2 bg-slate-800 rounded-lg"><i data-lucide="file" class="w-4 h-4 text-blue-400"></i></div>
                    <div class="overflow-hidden">
                        <p class="text-xs font-bold truncate">${f.name}</p>
                        <p class="text-[10px] text-slate-500">سحابي</p>
                    </div>
                </div>
                <div class="flex gap-2">
                    <a href="${data.publicUrl}" target="_blank" class="p-2 hover:bg-blue-500/10 rounded-lg text-blue-400 transition">
                        <i data-lucide="external-link" class="w-4 h-4"></i>
                    </a>
                    <button onclick="deleteFile('${f.name}')" class="p-2 hover:bg-red-500/10 rounded-lg text-red-400 transition">
                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                    </button>
                </div>
            </div>
        `;
    }).join('');
    lucide.createIcons();
}

// وظيفة الحذف
async function deleteFile(name) {
    if (!confirm("هل أنت متأكد من حذف الملف؟")) return;
    await supabase.storage.from('web-craft').remove([`uploads/${name}`]);
    fetchFiles();
}
