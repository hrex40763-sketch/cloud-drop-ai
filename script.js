// إعدادات الربط النهائية
const SB_URL = "https://yfdcehdtflpmjhtdktnz.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlmZGNlaGR0ZmxwbWpodGRrdG56Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ5NTk1NzcsImV4cCI6MjA4MDUzNTU3N30.phWJor_ZGI883-sdcqLf_riySSbkEMmk8kn_RIMzLpI";

const supabase = supabase.createClient(SB_URL, SB_KEY);
const BUCKET_NAME = 'web-craft'; // تأكد أن هذا الاسم مطابق لما في Supabase

const fileInput = document.getElementById('fileInput');
const dropZone = document.getElementById('dropZone');
const fileGrid = document.getElementById('fileGrid');
const progressBar = document.getElementById('progressBar');
const idleView = document.getElementById('idleView');
const uploadView = document.getElementById('uploadView');

// عند التحميل
window.onload = refreshFiles;

// تفعيل منطقة السحب
dropZone.onclick = () => fileInput.click();
dropZone.ondragover = (e) => { e.preventDefault(); dropZone.classList.add('dragover'); };
dropZone.ondragleave = () => dropZone.classList.remove('dragover');
dropZone.ondrop = (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    handleUpload(e.dataTransfer.files);
};

fileInput.onchange = (e) => handleUpload(e.target.files);

async function handleUpload(files) {
    if (files.length === 0) return;

    for (let file of files) {
        // تجهيز الواجهة
        idleView.classList.add('hidden');
        uploadView.classList.remove('hidden');
        document.getElementById('uploadFileName').innerText = file.name;
        progressBar.style.width = '20%';

        const fileName = `${Date.now()}-${file.name}`;
        
        // عملية الرفع
        const { data, error } = await supabase.storage
            .from(BUCKET_NAME)
            .upload(fileName, file, { cacheControl: '3600', upsert: false });

        if (error) {
            Swal.fire({ icon: 'error', title: 'فشل الرفع', text: error.message, background: '#1e293b', color: '#fff' });
        } else {
            progressBar.style.width = '100%';
            setTimeout(() => {
                Swal.fire({ icon: 'success', title: 'تم الرفع!', timer: 1500, showConfirmButton: false });
                resetUploadView();
                refreshFiles();
            }, 500);
        }
    }
}

async function refreshFiles() {
    const { data, error } = await supabase.storage.from(BUCKET_NAME).list('', { limit: 10, order: { column: 'created_at', ascending: false } });
    
    if (error) return;

    fileGrid.innerHTML = data.map(file => {
        const { data: urlData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(file.name);
        return `
            <div class="glass p-4 rounded-2xl flex items-center justify-between hover:border-blue-500/50 transition group">
                <div class="flex items-center gap-3 overflow-hidden">
                    <div class="p-2 bg-blue-500/10 rounded-xl text-blue-400"><i data-lucide="file-text" class="w-4 h-4"></i></div>
                    <div class="truncate">
                        <p class="text-xs font-bold truncate w-32">${file.name}</p>
                        <p class="text-[9px] text-slate-500">سحابي آمن</p>
                    </div>
                </div>
                <div class="flex gap-2">
                    <button onclick="copyLink('${urlData.publicUrl}')" class="p-2 hover:bg-blue-500/20 rounded-lg text-slate-400 hover:text-blue-400 transition" title="نسخ الرابط"><i data-lucide="copy" class="w-4 h-4"></i></button>
                    <a href="${urlData.publicUrl}" target="_blank" class="p-2 hover:bg-emerald-500/20 rounded-lg text-slate-400 hover:text-emerald-400 transition" title="معاينة"><i data-lucide="eye" class="w-4 h-4"></i></a>
                    <button onclick="deleteFile('${file.name}')" class="p-2 hover:bg-red-500/20 rounded-lg text-slate-400 hover:text-red-400 transition" title="حذف"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                </div>
            </div>
        `;
    }).join('');
    lucide.createIcons();
}

function resetUploadView() {
    idleView.classList.remove('hidden');
    uploadView.classList.add('hidden');
    progressBar.style.width = '0%';
}

async function deleteFile(name) {
    const result = await Swal.fire({ title: 'هل أنت متأكد؟', text: "لن تتمكن من استعادة الملف!", icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444', cancelButtonColor: '#1e293b', confirmButtonText: 'نعم، احذفه' });
    
    if (result.isConfirmed) {
        await supabase.storage.from(BUCKET_NAME).remove([name]);
        refreshFiles();
    }
}

async function copyLink(url) {
    navigator.clipboard.writeText(url);
    Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'تم نسخ الرابط', showConfirmButton: false, timer: 2000 });
}
