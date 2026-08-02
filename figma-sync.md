---
name: figma-to-waseela-ui
description: تخصص تحويل تصاميم فيجما إلى كود أنجولر بريميوم باستخدام Tailwind و GSAP لمشروع Waseela مع ضمان عدم المساس بالتصميم الأصلي.
model-invocation: true
---

# Waseela Design System & Animation Skill

هذه الـ Skill مخصصة لضمان أن كل الـ Components التي يتم إنشاؤها تطابق معايير الجودة العالية (Luxury UI) لشركة Al Hendal، مع تحليل التصاميم بدقة وتحويلها لكود نظيف.

## 🛑 Permission & Scope (صلاحيات الوصول)
- **Read-Only Mode:** يُسمح لك فقط بـ "قراءة" (Read/Analyze) بيانات ملف الفيجما. يمنع منعاً باتاً اقتراح أو إجراء أي تعديل (Edit/Write) على التصميم، الطبقات (Layers)، أو النماذج (Prototypes) الأصلية.
- **Analysis Focus:** اقتصر تحليلك على استخراج خصائص CSS (CSS Properties)، أبعاد التصميم (Layout dimensions)، وتفاصيل الحركة (Prototyping transitions) لتحويلها إلى كود برمجي فقط.

## 🎨 Design Tokens (المعايير البصرية)
- **Primary Color:** `[#1D1DDB]` (الأزرق الأساسي).
- **Secondary Color:** `[#FF7A00]` (البرتقالي للـ Highlights والـ Buttons).
- **Backgrounds:** استخدام `bg-[#eef5ff]` للـ Sections الفاتحة و `rounded-[40px]` للحاويات الكبيرة.
- **Typography:** التزم بالخطوط (Fonts) والأوزان (Weights) المطابقة لما تم استخدامه مسبقاً في `features.component.html`.

## 🖼️ Image & Assets Handling
- **Asset Access:** يُسمح للـ Agent بالوصول إلى مجلد `src/assets/` لاستخدام الصور واللوجوهات الفعلية للمشروع.
- **Matching Images:** عند رؤية صورة في ملف الفيجما أو الصور المرفقة (مثل @image_179bc1.png)، ابحث عن الملف المطابق لها في مجلد الـ assets واستخدم مساره الصحيح (مثلاً `assets/images/team/member1.png`).
- **Placeholder Fallback:** إذا لم تجد الصورة الأصلية، استخدم Placeholder مؤقت مع وضع تعليق `<!-- TODO: Replace with actual asset from Figma -->` لضمان استمرارية التصميم.
- **Consistency:** حافظ على استخدام نفس أسماء الملفات الموجودة في الـ Design Tokens لضمان التوافق بين التصميم والكود.

## 🛠 Technical Stack
- **Framework:** Angular 16 (استخدم أحدث أساليب التحكم في التدفق إن أمكن، وحافظ على هيكلة المجلدات المعتمدة).
- **Styling:** Tailwind CSS + SCSS (للتنسيقات المعقدة التي تتخطى قدرات Tailwind).
- **Animations:** مكتبة GSAP حصراً.

## 🏃 Animation Guidelines (GSAP)
عند تحويل أي حركة من Prototype الفيجما:
1. **Initial Load:** استخدم `gsap.from()` لعمل `stagger` للعناصر (مثل الكروت) عند تحميل الصفحة (Duration: 0.8s, Ease: "power2.out").
2. **Interactive Elements:** الـ Expand/Collapse (مثلما في صفحة Careers) يجب أن ينفذ بـ Smooth Height animation عبر GSAP وليس مجرد CSS Display none.
3. **Hover States:** أي Hover effect على الأزرار (مثل Submit Application) يجب أن يتضمن Smooth transition يطابق الـ Prototype.

## 🔗 Figma Reference
- **Project URL:** https://www.figma.com/design/RKsrVZsDmL6FU1rXDynSFo/wsite
- **Task:** دائماً راجع الـ Layers، الـ Spacing، والـ Easing functions في الرابط أعلاه قبل كتابة أي كود HTML أو TypeScript.

## 📝 Instructions for Agent
- عند استخدام `/figma-to-waseela-ui` في الشات، قم بإجراء Deep Scan لملف الفيجما المرفق لاستيعاب المنطق البصري والحركي.
- تأكد أن الـ HTML الناتج هو Pixel-Perfect ومطابق للتصميم.
- اكتب كود Modular وسهل الصيانة (Clean Code)، وافصل المكونات المنطقية إذا لزم الأمر.