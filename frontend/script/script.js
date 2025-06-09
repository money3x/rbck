// Translations Object
const translations = {
    th: {
        welcome_title: "ยินดีต้อนรับสู่ ระเบียบการช่าง", welcome_subtitle: "ผู้นำด้านรถเกี่ยวข้าวและบริการครบวงจรเพื่อเกษตรกรไทย", enter_website_btn: "เข้าสู่เว็บไซต์",
        brand_name_short_html: "ระเบียบ<span>การช่าง</span>", brand_name_short_mobile_html: "ระเบียบ<span>การช่าง</span>",
        nav_home: "หน้าแรก", nav_services: "บริการ", nav_products: "รถเกี่ยวข้าว", nav_why_us: "ทำไมต้องเลือกเรา", nav_blog: "บทความ", nav_about: "เกี่ยวกับเรา", nav_testimonials: "ลูกค้าพูดถึง", nav_contact: "ติดต่อ",
        hero_title: "ผู้นำด้านรถเกี่ยวข้าว และบริการครบวงจร", hero_subtitle: "ระเบียบการช่าง - พันธมิตรที่เกษตรกรไว้วางใจ จำหน่าย ซ่อมแซม และให้คำปรึกษาเรื่องรถเกี่ยวข้าว", hero_cta_button: "ดูรถเกี่ยวข้าวทั้งหมด",
        services_title: "บริการของเราเพื่อคุณ", services_repair_icon: "ซ่อม", services_repair_title: "รับซ่อมรถเกี่ยวข้าว", services_repair_desc: "บริการซ่อมรถเกี่ยวข้าวทุกรุ่น ทุกยี่ห้อ ด้วยทีมช่างมืออาชีพ ประสบการณ์สูง พร้อมอะไหล่แท้ รับประกันคุณภาพงานซ่อม รวดเร็ว ทันใจ", services_new_icon: "ใหม่", services_new_title: "จำหน่ายรถเกี่ยวข้าวใหม่", services_new_desc: "คัดสรรรถเกี่ยวข้าวใหม่จากแบรนด์ชั้นนำ เทคโนโลยีล่าสุด ประสิทธิภาพเยี่ยม ตอบโจทย์ทุกการใช้งาน พร้อมข้อเสนอสุดพิเศษและบริการหลังการขาย", services_used_icon: "มือ2", services_used_title: "จำหน่ายรถเกี่ยวข้าวมือสอง", services_used_desc: "รถเกี่ยวข้าวมือสองคุณภาพดี ตรวจเช็คสภาพอย่างละเอียด ราคาคุ้มค่า พร้อมใช้งานทันที ตัวเลือกที่ชาญฉลาดสำหรับเกษตรกรยุคใหม่",
        products_title: "รถเกี่ยวข้าวคุณภาพเพื่อผลผลิตที่เหนือกว่า", product1_img_alt: "ภาพรถเกี่ยวข้าว รุ่น Titan X (ใหม่)", product1_name: "รถเกี่ยวข้าว รุ่น Titan X (ใหม่)", product1_desc: "นวัตกรรมล่าสุด! เกี่ยวเร็ว เกี่ยวไว ลุยได้ทุกสภาพนา พร้อมเทคโนโลยีประหยัดน้ำมัน", product1_price: "ราคา: ติดต่อสอบถาม", product2_img_alt: "ภาพรถเกี่ยวข้าว รุ่น ProHarvest Z (มือสอง)", product2_name: "รถเกี่ยวข้าว รุ่น ProHarvest Z (มือสอง)", product2_desc: "สภาพเยี่ยม ตรวจเช็คกว่า 50 รายการ ชั่วโมงการทำงานน้อย คุ้มค่าเกินราคา", product2_price_val: "ราคา: 750,000 บาท", product3_img_alt: "ภาพรถเกี่ยวข้าว รุ่น EcoCrop S (ใหม่)", product3_name: "รถเกี่ยวข้าว รุ่น EcoCrop S (ใหม่)", product3_desc: "คล่องตัว ประหยัด เหมาะสำหรับแปลงนาขนาดกลางถึงเล็ก ทนทาน ดูแลรักษาง่าย", product3_price: "ราคา: ติดต่อสอบถาม", product_cta: "สนใจ/สอบถาม", products_note_contact_html: "<em>เรามีรถเกี่ยวข้าวหลากหลายรุ่นให้เลือกสรร ตอบโจทย์ทุกความต้องการ <a href=\"#contact\">ติดต่อเรา</a> เพื่อรับคำแนะนำเพิ่มเติม</em>",
        why_us_title: "ทำไมต้องเลือก ระเบียบการช่าง?", why_us1_title: "ประสบการณ์ยาวนาน", why_us1_desc: "เราอยู่ในวงการรถเกี่ยวข้าวมานานกว่า 15 ปี เข้าใจทุกปัญหาและความต้องการของเกษตรกรไทย", why_us2_title: "ทีมช่างมืออาชีพ", why_us2_desc: "ช่างของเราผ่านการฝึกอบรมและมีประสบการณ์สูง สามารถวิเคราะห์และแก้ไขปัญหาได้อย่างแม่นยำ", why_us3_title: "สินค้าคุณภาพ", why_us3_desc: "คัดสรรเฉพาะรถเกี่ยวข้าวและอะไหล่ที่มีคุณภาพมาตรฐานสากล มั่นใจได้ในประสิทธิภาพและความทนทาน", why_us4_title: "บริการด้วยใจ", why_us4_desc: "เราให้ความสำคัญกับความพึงพอใจของลูกค้า พร้อมให้คำปรึกษาและบริการหลังการขายที่ดีเยี่ยม",
        blog_title: "บทความและสาระน่ารู้", blog_ai_notice: "*เนื้อหาและภาพประกอบบทความนี้เป็นตัวอย่างที่สร้างขึ้นเพื่อการสาธิต", blog_read_more: "อ่านเพิ่มเติม", blog_note_contact_html: "<em><a href=\"#contact\">ติดต่อเรา</a> หากคุณมีคำถามหรือต้องการคำแนะนำเพิ่มเติมเกี่ยวกับรถเกี่ยวข้าว</em>",
        about_title: "เกี่ยวกับเรา: ระเบียบการช่าง", about_text_html: "ระเบียบการช่าง ก่อตั้งขึ้นจากความมุ่งมั่นที่จะเป็นส่วนหนึ่งในการขับเคลื่อนภาคเกษตรกรรมไทยให้ก้าวหน้า เราคือผู้เชี่ยวชาญด้านรถเกี่ยวข้าวตัวจริง ด้วยประสบการณ์ที่สั่งสมมายาวนาน เราเข้าใจถึงความต้องการของพี่น้องเกษตรกรเป็นอย่างดี<br><br>ภารกิจหลักของเราคือการจัดหาและจำหน่ายรถเกี่ยวข้าวคุณภาพสูง ทั้งรถใหม่เทคโนโลยีล้ำสมัย และรถมือสองสภาพดีที่ผ่านการคัดสรรและตรวจสอบอย่างเข้มงวด นอกจากนี้ เรายังมีบริการซ่อมบำรุงรถเกี่ยวข้าวทุกประเภทโดยทีมช่างผู้ชำนาญการ พร้อมด้วยอะไหล่แท้ครบครัน<br><br>เราเชื่อมั่นว่าเครื่องจักรกลการเกษตรที่มีประสิทธิภาพคือหัวใจสำคัญในการเพิ่มผลผลิตและลดต้นทุน ระเบียบการช่างจึงพร้อมเป็นเพื่อนคู่คิดและที่ปรึกษา ให้เกษตรกรทุกท่านมั่นใจได้ว่าจะได้รับการบริการที่ดีที่สุด สินค้าที่คุ้มค่าที่สุด เพื่อความสำเร็จที่ยั่งยืนในการทำเกษตรกรรม",
        testimonials_title: "เสียงจากลูกค้าของเรา", testimonial1_quote: "\"ซ่อมรถเกี่ยวที่นี่จบจริงครับ ช่างเก่ง ให้คำแนะนำดีมาก รถกลับมาใช้งานได้เหมือนใหม่เลย ประทับใจครับ\"", testimonial1_cite: "-- คุณสมชาย, เกษตรกร จ.สุพรรณบุรี", testimonial2_quote: "\"ซื้อรถเกี่ยวข้าวมือสองจากระเบียบฯ ไป สภาพดีมากครับ ราคาไม่แพงด้วย คุ้มค่าจริงๆ บริการหลังการขายก็ดูแลดี\"", testimonial2_cite: "-- คุณประนอม, เกษตรกร จ.นครสวรรค์", testimonial3_quote: "\"พนักงานให้คำแนะนำดีมากครับ ช่วยเลือกรุ่นรถเกี่ยวข้าวใหม่ได้ตรงกับขนาดนาและการใช้งานของผมเลย ถูกใจมากครับ\"", testimonial3_cite: "-- คุณวิรัช, เกษตรกร จ.พิจิตร",
        contact_title: "ติดต่อเราเพื่อสอบถามหรือรับบริการ", contact_info_title: "ข้อมูลการติดต่อ", contact_company_name: "ระเบียบการช่าง", contact_address_label: "ที่อยู่:", contact_address_value: "123 หมู่ 4 ถนนข้าวหอม ตำบลรุ่งเรือง อำเภอเมืองใหม่ จังหวัดเกษตรสมบูรณ์ 12345", contact_address_note: "(กรุณาใส่ที่อยู่จริง)", contact_phone_label: "โทรศัพท์:", contact_phone_note: "(กรุณาใส่เบอร์โทรศัพท์จริง)", contact_email_label: "อีเมล:", contact_email_value: "contact@rbkanchang.com", contact_email_note: "(กรุณาใส่อีเมลจริง)", contact_line_label: "Line ID:", contact_line_value: "@xxxx", contact_line_note: "(ตัวอย่าง)", contact_hours_label: "เวลาทำการ:", contact_hours_value: "จันทร์ - เสาร์, 8:00 - 17:30 น. (อาทิตย์ ปิด)",
        contact_form_title: "ส่งข้อความถึงเรา", form_name_label: "ชื่อ-นามสกุล:", form_name_placeholder: "เช่น สมชาย ใจดี", form_email_label: "อีเมล:", form_email_placeholder: "your@email.com", form_phone_label: "เบอร์โทรศัพท์:", form_phone_placeholder: "08xxxxxxxx", form_subject_label: "หัวข้อเรื่อง:", form_subject_placeholder: "เช่น สอบถามราคารถเกี่ยว, ปรึกษาปัญหา", form_message_label: "ข้อความ:", form_message_placeholder: "รายละเอียดที่ต้องการสอบถาม...", form_submit_button: "ส่งข้อความ",
        footer_copyright_html: "&copy; <span id=\"currentYear\"></span> ระเบียบการช่าง. สงวนลิขสิทธิ์.", footer_developed_by_html: "พัฒนาเว็บไซต์โดย Beermaronz",
        change_language_label: "เปลี่ยนภาษา", lang_option_thai: "ไทย", lang_option_eng: "ENG"
    },
    en: {
        welcome_title: "Welcome to Rabeab Kanchang", welcome_subtitle: "Leader in rice harvesters and comprehensive services for Thai farmers.", enter_website_btn: "Enter Website",
        brand_name_short_html: "Rabeab<span>Kanchang</span>", brand_name_short_mobile_html: "Rabeab<span>Kanchang</span>",
        nav_home: "Home", nav_services: "Services", nav_products: "Harvesters", nav_why_us: "Why Us", nav_blog: "Blog", nav_about: "About Us", nav_testimonials: "Testimonials", nav_contact: "Contact",
        hero_title: "Leader in Rice Harvesters & Comprehensive Services", hero_subtitle: "Rabeab Kanchang - The trusted partner for farmers. Sales, repairs, and expert advice on rice harvesters.", hero_cta_button: "View All Harvesters",
        services_title: "Our Services For You", services_repair_icon: "Repair", services_repair_title: "Rice Harvester Repairs", services_repair_desc: "Repair services for all brands and models of rice harvesters by experienced professional technicians. Genuine parts and guaranteed quality service. Fast and reliable.", services_new_icon: "New", services_new_title: "New Rice Harvesters for Sale", services_new_desc: "Selection of new rice harvesters from leading brands. Latest technology, high efficiency, suitable for all needs. Special offers and comprehensive after-sales service.", services_used_icon: "Used", services_used_title: "Used Rice Harvesters for Sale", services_used_desc: "High-quality used rice harvesters, thoroughly inspected, excellent condition, and affordable prices. Ready to use. A smart choice for modern farmers.",
        products_title: "Quality Harvesters for Superior Yields", product1_img_alt: "Image of Harvester Model Titan X (New)", product1_name: "Harvester Model Titan X (New)", product1_desc: "Latest innovation! Fast harvesting, handles all field conditions, with fuel-saving technology.", product1_price: "Price: Contact Us", product2_img_alt: "Image of Harvester Model ProHarvest Z (Used)", product2_name: "Harvester Model ProHarvest Z (Used)", product2_desc: "Excellent condition, over 50 inspection points, low operating hours. Great value.", product2_price_val: "Price: 750,000 THB", product3_img_alt: "Image of Harvester Model EcoCrop S (New)", product3_name: "Harvester Model EcoCrop S (New)", product3_desc: "Agile, economical, suitable for small to medium-sized fields. Durable and easy to maintain.", product3_price: "Price: Contact Us", product_cta: "Inquire/Details", products_note_contact_html: "<em>We offer a wide variety of harvesters to meet all needs. <a href=\"#contact\">Contact us</a> for more advice.</em>",
        why_us_title: "Why Choose Rabeab Kanchang?", why_us1_title: "Extensive Experience", why_us1_desc: "We have been in the rice harvester industry for over 15 years, understanding all the problems and needs of Thai farmers.", why_us2_title: "Professional Technicians", why_us2_desc: "Our technicians are well-trained and highly experienced, capable of accurately diagnosing and resolving issues.", why_us3_title: "Quality Products", why_us3_desc: "We select only harvesters and spare parts that meet international quality standards, ensuring performance and durability.", why_us4_title: "Service with Heart", why_us4_desc: "Customer satisfaction is our priority. We provide excellent consultation and after-sales service.",
        blog_title: "Articles & Useful Information", blog_ai_notice: "*Content and images in this article are illustrative examples.", blog_read_more: "Read More", blog_note_contact_html: "<em><a href=\"#contact\">Contact us</a> if you have questions or need more advice about rice harvesters.</em>",
        about_title: "About Us: Rabeab Kanchang", about_text_html: "Rabeab Kanchang was founded with a commitment to support and advance Thai agriculture. We are true experts in rice harvesters, with extensive experience understanding the needs of our fellow farmers.<br><br>Our core mission is to supply high-quality rice harvesters, including new models with cutting-edge technology and meticulously inspected, high-quality used machines. Additionally, we offer comprehensive repair and maintenance services for all types of harvesters, performed by skilled technicians using genuine spare parts.<br><br>We believe that efficient agricultural machinery is key to increasing productivity and reducing costs. Rabeab Kanchang is ready to be your trusted partner and advisor, ensuring all farmers receive the best service and most valuable products for sustainable success in agriculture.",
        testimonials_title: "What Our Customers Say", testimonial1_quote: "\"Harvester repair here is excellent! The technicians are skilled and give great advice. My machine works like new. Very impressed!\"", testimonial1_cite: "-- Somchai, Farmer from Suphanburi", testimonial2_quote: "\"Bought a used harvester from Rabeab Kanchang. It's in great condition and reasonably priced. Truly great value. After-sales service is also very good.\"", testimonial2_cite: "-- Pranom, Farmer from Nakhon Sawan", testimonial3_quote: "\"The staff provided excellent advice, helping me choose a new harvester that perfectly fits my field size and needs. Very satisfied!\"", testimonial3_cite: "-- Wirat, Farmer from Phichit",
        contact_title: "Contact Us for Inquiries or Services", contact_info_title: "Contact Information", contact_company_name: "Rabeab Kanchang", contact_address_label: "Address:", contact_address_value: "123 Moo 4, Khaohom Rd, Rungrueang Sub-district, Mueang Mai District, Kaset Sombun Province 12345", contact_address_note: "(Please provide actual address)", contact_phone_label: "Phone:", contact_phone_note: "(Please provide actual phone numbers)", contact_email_label: "Email:", contact_email_value: "contact@rbkanchang.com", contact_email_note: "(Please provide actual email)", contact_line_label: "Line ID:", contact_line_value: "@xxxx", contact_line_note: "(Example)", contact_hours_label: "Hours:", contact_hours_value: "Mon - Sat, 8:00 AM - 5:30 PM (Sun Closed)",
        contact_form_title: "Send Us a Message", form_name_label: "Name:", form_name_placeholder: "e.g., John Doe", form_email_label: "Email:", form_email_placeholder: "your@email.com", form_phone_label: "Phone:", form_phone_placeholder: "08xxxxxxxx", form_subject_label: "Subject:", form_subject_placeholder: "e.g., Harvester price inquiry, Problem consultation", form_message_label: "Message:", form_message_placeholder: "Details of your inquiry...", form_submit_button: "Send Message",
        footer_copyright_html: "&copy; <span id=\"currentYear\"></span> Rabeab Kanchang. All rights reserved.", footer_developed_by_html: "Website developed by Beermaronz",
        change_language_label: "Language", lang_option_thai: "Thai", lang_option_eng: "ENG"
    }
};

let currentLanguage = 'th';

/**
 * Sanitize HTML ด้วย DOMPurify (ต้อง import DOMPurify ใน HTML/JS)
 * @param {string} html
 * @returns {string}
 */
function sanitize(html) {
    if (window.DOMPurify) {
        return window.DOMPurify.sanitize(html);
    }
    // fallback: basic sanitization but preserve HTML structure
    // For trusted content from our own server, we can allow HTML
    return html;
}

function setLanguage(lang) {
    console.log(`Setting language to: ${lang}`);
    currentLanguage = lang;
    document.documentElement.lang = lang;

    const elements = document.querySelectorAll('[data-translate-key]');
    elements.forEach(el => {
        const key = el.getAttribute('data-translate-key');
        if (translations[lang] && translations[lang][key] !== undefined) {
            if (key.endsWith('_html')) {
                el.innerHTML = sanitize(translations[lang][key]);
            } else {
                el.innerText = translations[lang][key];
            }
        }
    });

    const placeholderElements = document.querySelectorAll('[data-translate-placeholder-key]');
    placeholderElements.forEach(el => {
        const key = el.getAttribute('data-translate-placeholder-key');
        if (translations[lang] && translations[lang][key] !== undefined) {
            el.placeholder = translations[lang][key];
        }
    });
    
    ['languageSelectorDesktop', 'languageSelectorMobile'].forEach(selectorId => {
        const langSelectorInstance = document.getElementById(selectorId);
        if (langSelectorInstance) {
            const toggleTextEl = langSelectorInstance.querySelector('.language-selector-toggle span[data-translate-key="change_language_label"]');
            if (toggleTextEl && translations[lang] && translations[lang].change_language_label !== undefined) {
                toggleTextEl.innerText = translations[lang].change_language_label;
            }
            langSelectorInstance.querySelectorAll('.language-options .lang-option').forEach(opt => {
                opt.classList.remove('active');
                if (opt.getAttribute('data-lang') === lang) {
                    opt.classList.add('active');
                }
                const optKey = opt.getAttribute('data-translate-key');
                if (translations[lang] && translations[lang][optKey] !== undefined) {
                    opt.innerText = translations[lang][optKey];
                }
            });
        }
    });
    updateActiveNavLinksOnScrollReal();
}

// ===== CMS Integration Functions =====

// Function to load blog posts from API
async function loadBlogPosts() {
    try {
        console.log('Loading blog posts from API...');        const API_URL = window.location.hostname === 'localhost' 
            ? 'http://localhost:10000/api/blog-html'
            : 'https://rbck.onrender.com/api/blog-html';
            
        console.log('Fetching from:', API_URL);
        const response = await fetch(API_URL);
        console.log('Response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Received data:', { count: data.count, hasHtml: !!data.html });
          const blogGrid = document.querySelector('#blog .blog-grid');
        if (blogGrid && data.html) {
            // Use innerHTML directly for blog content (server-side generated HTML is trusted)
            blogGrid.innerHTML = data.html;
            console.log(`Loaded ${data.count} blog posts`);
            
            // Apply translations after loading new content
            setLanguage(currentLanguage);
        } else {
            console.warn('Blog grid element not found or no HTML data received', {
                gridFound: !!blogGrid,
                htmlReceived: !!data.html
            });
            throw new Error('Blog grid element not found or no HTML data received');
        }
    } catch (error) {
        console.error('Error loading blog posts:', error);        // Fallback content
        const blogGrid = document.querySelector('#blog .blog-grid');
        if (blogGrid) {
            blogGrid.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #6c757d; grid-column: 1 / -1;">
                    <p>ไม่สามารถโหลดบทความได้ในขณะนี้ กรุณาลองใหม่อีกครั้ง</p>
                    <p style="color: #999; font-size: 0.9em; margin: 10px 0;">Error: ${error.message}</p>
                    <button onclick="loadBlogPosts()" style="background: #27533b; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; margin-top: 10px;">โหลดใหม่</button>
                </div>
            `;
        }
    }
}

// Function to update translations from API
async function loadTranslations() {
    try {
        console.log('Loading translations from API...');        const API_URL = window.location.hostname === 'localhost' 
            ? 'http://localhost:10000/api/translations'
            : 'https://rbck.onrender.com/api/translations';
            
        console.log('Fetching translations from:', API_URL);
        const response = await fetch(API_URL);
        const newTranslations = await response.json();
        
        // Merge new translations with existing ones
        Object.keys(newTranslations).forEach(lang => {
            if (translations[lang]) {
                Object.assign(translations[lang], newTranslations[lang]);
                console.log(`Updated ${Object.keys(newTranslations[lang]).length} translations for ${lang}`);
            }
        });
        
        // Re-apply current language
        setLanguage(currentLanguage);
    } catch (error) {
        console.error('Error loading translations:', error);
        // Continue with existing translations if API fails
    }
}

// Welcome screen and navigation setup
const welcomeScreen = document.getElementById('welcomeScreen');
const enterButton = document.getElementById('enterWebsiteButton');
const mainHeader = document.getElementById('mainHeader');
const mainContentArea = document.getElementById('mainContentArea');
const body = document.body;

if (enterButton) {
    enterButton.addEventListener('click', async () => {
        console.log("Enter website button clicked.");
        if (welcomeScreen) {
            welcomeScreen.style.display = 'none';
            console.log("Welcome screen hidden.");
        }
        if (mainHeader) {
            mainHeader.style.display = 'block';
            console.log("Main header displayed.");
        }
        if (mainContentArea) {
            mainContentArea.style.display = 'block';
            console.log("Main content area displayed.");
        }
        body.style.overflowX = 'hidden';
        body.style.overflowY = 'auto';
        
        // Load dynamic content after entering
        await loadTranslations();
        await loadBlogPosts();
        
        updateActiveNavLinksOnScrollReal();
    });
}

const menuToggle = document.getElementById('menuToggle');
const mobileNavPanel = document.getElementById('mobileNavPanel');
const closeMenuBtn = document.getElementById('closeMenuBtn');

function openMobileMenu() {
    if (mobileNavPanel) mobileNavPanel.classList.add('active');
    if (menuToggle) menuToggle.setAttribute('aria-expanded', 'true');
    body.style.overflowY = 'hidden';
}

function closeMobileMenu() {
    if (mobileNavPanel) mobileNavPanel.classList.remove('active');
    if (menuToggle) menuToggle.setAttribute('aria-expanded', 'false');
    body.style.overflowY = 'auto';
}

if (menuToggle) menuToggle.addEventListener('click', openMobileMenu);
if (closeMenuBtn) closeMenuBtn.addEventListener('click', closeMobileMenu);
if (mobileNavPanel) {
    mobileNavPanel.addEventListener('click', function(e) {
        if (e.target === mobileNavPanel) closeMobileMenu();
    });
    mobileNavPanel.querySelectorAll('ul li a').forEach(link => {
        link.addEventListener('click', closeMobileMenu);
    });
    mobileNavPanel.querySelectorAll('.language-options .lang-option').forEach(option => {
        option.addEventListener('click', closeMobileMenu);
    });
}

const allNavLinks = document.querySelectorAll('#mainNav a, .mobile-nav-panel ul li a');
allNavLinks.forEach(link => {
    link.addEventListener('click', function(e) {
        const targetId = this.getAttribute('href');
        if (targetId && targetId.startsWith('#') && targetId.length > 1) {
            e.preventDefault();
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                const headerEl = document.querySelector('header#mainHeader');
                const headerOffset = headerEl ? headerEl.offsetHeight : 0;
                const elementPosition = targetElement.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
                window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
            }
        }
        allNavLinks.forEach(nav => nav.classList.remove('active'));
        this.classList.add('active');
        const key = this.dataset.translateKey?.replace('_mobile', '');
        if (key) {
            document.querySelectorAll(`[data-translate-key="${key}"], [data-translate-key="${key}_mobile"]`).forEach(counterpart => {
                if(counterpart) counterpart.classList.add('active');
            });
        }
    });
});

function updateActiveNavLinksOnScrollReal() {
    if (!mainContentArea || mainContentArea.style.display !== 'block') return;
    let currentSectionId = '';
    const sections = document.querySelectorAll('main section');
    const headerEl = document.querySelector('header#mainHeader');
    const headerOffset = (headerEl ? headerEl.offsetHeight : 0) + 20;
    sections.forEach(section => {
        const sectionTop = section.offsetTop - headerOffset;
        if (window.pageYOffset >= sectionTop) currentSectionId = section.getAttribute('id');
    });
    if (currentSectionId === '' && sections.length > 0 && sections[0] && window.pageYOffset < (sections[0].offsetTop - headerOffset) ) currentSectionId = 'hero';
    else if (currentSectionId === '' && sections.length === 0) currentSectionId = 'hero';
    
    allNavLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href')?.substring(1) === currentSectionId) link.classList.add('active');
    });
}
window.addEventListener('scroll', updateActiveNavLinksOnScrollReal);

const contactForm = document.getElementById('contactForm');
if (contactForm) {
    contactForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const name = contactForm.querySelector('#name')?.value;
        const email = contactForm.querySelector('#email')?.value;
        const message = contactForm.querySelector('#message')?.value;
        const alertMessages = {
            th: { success: `ขอบคุณสำหรับข้อความจากคุณ ${name}! เราจะติดต่อกลับโดยเร็วที่สุด`, error: 'กรุณากรอกข้อมูลในช่องที่มีเครื่องหมาย * ให้ครบถ้วน' },
            en: { success: `Thank you for your message, ${name}! We will get back to you soon.`, error: 'Please fill in all required fields marked with *.' }
        };
        if (name && email && message) { 
            alert(alertMessages[currentLanguage].success); 
            contactForm.reset(); 
        } else { 
            alert(alertMessages[currentLanguage].error); 
        }
    });
}

['languageSelectorDesktop', 'languageSelectorMobile'].forEach(selectorId => {
    const languageSelector = document.getElementById(selectorId);
    if (languageSelector) {
        const toggle = languageSelector.querySelector('.language-selector-toggle');
        if (toggle) {
            toggle.addEventListener('click', (event) => {
                event.stopPropagation();
                languageSelector.classList.toggle('open');
                toggle.setAttribute('aria-expanded', languageSelector.classList.contains('open'));
            });
        }
        languageSelector.querySelectorAll('.language-options .lang-option').forEach(option => {
            option.addEventListener('click', function() {
                const newLang = this.getAttribute('data-lang');
                if (newLang !== currentLanguage) setLanguage(newLang);
                languageSelector.classList.remove('open');
                if (toggle) toggle.setAttribute('aria-expanded', 'false');
            });
        });
    }
});

document.addEventListener('click', (event) => {
    ['languageSelectorDesktop', 'languageSelectorMobile'].forEach(selectorId => {
        const languageSelector = document.getElementById(selectorId);
        if (languageSelector && !languageSelector.contains(event.target) && languageSelector.classList.contains('open')) {
            languageSelector.classList.remove('open');
            const toggle = languageSelector.querySelector('.language-selector-toggle');
            if (toggle) toggle.setAttribute('aria-expanded', 'false');
        }
    });
});

// Main initialization
document.addEventListener('DOMContentLoaded', async () => {
    console.log("DOMContentLoaded: Initializing page...");
    
    // Set initial language
    setLanguage(currentLanguage);
    
    // Set current year
    const currentYearEl = document.getElementById('currentYear');
    if (currentYearEl) {
        currentYearEl.textContent = new Date().getFullYear();
    }
    
    console.log("DOMContentLoaded: Page initialization complete.");
});

// Optional: Check for content updates periodically
let updateInterval;
function startContentUpdates() {
    // Update content every 5 minutes if page is visible
    updateInterval = setInterval(async () => {
        if (document.visibilityState === 'visible' && mainContentArea.style.display === 'block') {
            await loadBlogPosts();
        }
    }, 300000); // 5 minutes
}

function stopContentUpdates() {
    if (updateInterval) {
        clearInterval(updateInterval);
    }
}

// Start content updates when page becomes visible
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
        startContentUpdates();
    } else {
        stopContentUpdates();
    }
});