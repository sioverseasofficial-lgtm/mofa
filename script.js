document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const dataParam = urlParams.get('d');

    if (dataParam) {
        // Switch to Document View mode
        document.getElementById('generator-view').classList.add('hidden');
        document.getElementById('document-view').classList.remove('hidden');
        
        try {
            // Decode the URL data back to JSON using LZString
            const jsonStr = LZString.decompressFromEncodedURIComponent(dataParam);
            const data = JSON.parse(jsonStr);
            
            // Populate document fields safely
            document.getElementById('out_aN_text').textContent = data.aN || '';
            document.getElementById('out_aD').textContent = data.aD || '';
            
            // Load the image, fallback to placeholder if none
            document.getElementById('out_photo').src = data.pU || 'https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png?20150327203541';
            
            document.getElementById('out_m').textContent = data.m || '';
            document.getElementById('out_vT').textContent = data.vT || '';
            document.getElementById('out_e').textContent = data.e || '';
            document.getElementById('out_sN').textContent = data.sN || '';
            document.getElementById('out_a').textContent = data.a || '';
            document.getElementById('out_n').textContent = data.n || '';
            document.getElementById('out_pN').textContent = data.pN || '';
            document.getElementById('out_pT').textContent = data.pT || '';
            document.getElementById('out_dE').textContent = data.dE || '';
            document.getElementById('out_dB').textContent = data.dB || '';
            document.getElementById('out_pB').textContent = data.pB || '';
            document.getElementById('out_cN').textContent = data.cN || '';
            document.getElementById('out_g').textContent = data.g || '';
            document.getElementById('out_o').textContent = data.o || '';
            document.getElementById('out_p').textContent = data.p || '';

            // Generate Barcode using jsbarcode
            if (data.aN) {
                JsBarcode("#out_barcode", data.aN, {
                    format: "CODE128",
                    displayValue: false, // Don't show text under barcode
                    height: 35,
                    width: 1.5,
                    margin: 0,
                    background: "transparent",
                    lineColor: "#000000"
                });
            }

        } catch (e) {
            console.error("Failed to parse data", e);
            alert("The URL link seems to be broken or invalid.");
        }

    } else {
        // We are in Generator View mode
        const form = document.getElementById('visa-form');
        const fileInput = document.getElementById('in_pFile');
        const photoPreview = document.getElementById('photo-preview');
        const base64Input = document.getElementById('in_pU_base64');
        const uploadStatus = document.getElementById('upload-status');
        
        // Handle Photo Upload and Cloud Storage
        fileInput.addEventListener('change', async function(e) {
            const file = e.target.files[0];
            if (file) {
                // Show uploading status
                uploadStatus.style.display = 'block';
                uploadStatus.textContent = 'Uploading image to cloud...';
                uploadStatus.style.color = '#3b82f6';
                photoPreview.style.display = 'none';
                base64Input.value = '';
                
                try {
                    const formData = new FormData();
                    formData.append("image", file);
                    
                    const response = await fetch("https://api.imgur.com/3/image", {
                        method: "POST",
                        headers: {
                            Authorization: "Client-ID 34b90f75e2fbd03" // Public Client ID for free image hosting
                        },
                        body: formData
                    });
                    
                    const data = await response.json();
                    if (data.success) {
                        const imageUrl = data.data.link;
                        photoPreview.src = imageUrl;
                        photoPreview.style.display = 'block';
                        base64Input.value = imageUrl; // We store the cloud URL instead of compressed data!
                        uploadStatus.textContent = 'Upload successful! High quality image secured.';
                        uploadStatus.style.color = '#16a34a';
                    } else {
                        throw new Error(data.data.error || "Upload failed");
                    }
                } catch (error) {
                    console.error("Upload error:", error);
                    uploadStatus.textContent = 'Failed to upload image. Trying low-quality fallback...';
                    uploadStatus.style.color = '#dc2626';
                    
                    // Fallback to the aggressive compression if cloud upload fails
                    compressImage(file, function(dataUrl) {
                        photoPreview.src = dataUrl;
                        photoPreview.style.display = 'block';
                        base64Input.value = dataUrl;
                        uploadStatus.textContent = 'Uploaded using low-quality fallback due to cloud error.';
                        uploadStatus.style.color = '#ca8a04';
                    });
                }
            }
        });
        
        function compressImage(file, callback) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const img = new Image();
                img.onload = function() {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    
                    // Start with an aggressive scale
                    let width = img.width;
                    let height = img.height;
                    const MAX_WIDTH = 60;
                    const MAX_HEIGHT = 80;

                    if (width > height) {
                        if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
                    } else {
                        if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; }
                    }
                    
                    let quality = 0.5;

                    function shrink() {
                        canvas.width = width;
                        canvas.height = height;
                        
                        // Fill background with white
                        ctx.fillStyle = "white";
                        ctx.fillRect(0, 0, canvas.width, canvas.height);
                        ctx.drawImage(img, 0, 0, width, height);
                        
                        // Compress as JPEG
                        let dataUrl = canvas.toDataURL('image/jpeg', quality); 
                        
                        // Ensure the base64 string is small enough to fit in a QR code alongside other data
                        if (dataUrl.length > 1800) {
                            if (quality > 0.1) {
                                quality -= 0.1;
                                shrink();
                            } else if (width > 20) {
                                width *= 0.8;
                                height *= 0.8;
                                quality = 0.3;
                                shrink();
                            } else {
                                callback(dataUrl);
                            }
                        } else {
                            callback(dataUrl);
                        }
                    }
                    
                    shrink();
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        }

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            
            // Check if photo is uploaded and processed
            if (!base64Input.value) {
                alert("Please wait for the photo to process or select a photo.");
                return;
            }
            
            // Collect form data
            const data = {
                aN: document.getElementById('in_aN').value,
                aD: document.getElementById('in_aD').value,
                pU: base64Input.value,
                m: document.getElementById('in_m').value,
                vT: document.getElementById('in_vT').value,
                e: document.getElementById('in_e').value,
                sN: document.getElementById('in_sN').value,
                a: document.getElementById('in_a').value,
                n: document.getElementById('in_n').value,
                pN: document.getElementById('in_pN').value,
                pT: document.getElementById('in_pT').value,
                dE: document.getElementById('in_dE').value,
                dB: document.getElementById('in_dB').value,
                pB: document.getElementById('in_pB').value,
                cN: document.getElementById('in_cN').value,
                g: document.getElementById('in_g').value,
                o: document.getElementById('in_o').value,
                p: document.getElementById('in_p').value,
                ts: Date.now() // Unique timestamp ensures the link/QR is always unique!
            };

            // Compress JSON string into Base64 using LZString to keep URL short
            const jsonStr = JSON.stringify(data);
            const encodedStr = LZString.compressToEncodedURIComponent(jsonStr);
            
            // Generate full URL
            const currentUrl = window.location.href.split('?')[0];
            const finalUrl = `${currentUrl}?d=${encodedStr}`;
            
            // Show the result section
            const resultSection = document.getElementById('result-section');
            resultSection.classList.remove('hidden');
            
            const generatedLink = document.getElementById('generated-link');
            generatedLink.href = finalUrl;
            
            // Generate QR Code using QRCode.js
            const qrContainer = document.getElementById('qrcode');
            qrContainer.innerHTML = ''; // Clear previous QR if any
            
            try {
                // Ensure QR code can handle the large URL
                new QRCode(qrContainer, {
                    text: finalUrl,
                    width: 300,
                    height: 300,
                    colorDark : "#000000",
                    colorLight : "#ffffff",
                    correctLevel : QRCode.CorrectLevel.L // Low error correction to allow max data size
                });
            } catch (err) {
                console.error("QR Code generation error:", err);
                qrContainer.innerHTML = "<p style='color:red;'>Error generating QR code. Image data might be too large. Try uploading a simpler image.</p>";
            }
            
            // Smoothly scroll down to the generated QR code
            resultSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    }
});
