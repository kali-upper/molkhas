// اختبار بيانات مجموعة واتساب جامعية
// Test University WhatsApp Group Data

import fs from 'fs';

function testUniversityData() {
    try {
        // قراءة ملف JSON
        const data = JSON.parse(fs.readFileSync('data/whatsapp-university-data.json', 'utf8'));

        console.log('🎓 مساعد بيانات مجموعة واتساب جامعية');
        console.log('=' .repeat(50));
        console.log(`📊 إجمالي الفئات: ${Object.keys(data).length}`);
        console.log(`🔗 روابط تعليمية: ${Object.keys(data.educational_links || {}).length}`);
        console.log(`📚 ملفات PDF: ${Object.keys(data.pdf_lectures || {}).length}`);
        console.log(`📅 جداول وامتحانات: ${Object.keys(data.schedules_sections || {}).length}`);
        console.log(`💡 نصائح طلابية: ${Object.keys(data.student_tips || {}).length}`);
        console.log(`🛠️ حلول تقنية: ${Object.keys(data.technical_issues || {}).length}`);
        console.log(`📱 أدوات وبرامج: ${Object.keys(data.tools_software || {}).length}`);
        console.log(`❓ أسئلة شائعة: ${(data.faq || []).length}`);

        // اختبار بعض الاستعلامات
        console.log('\n🔍 اختبار الاستعلامات:');

        // البحث عن كورسات البرمجة
        const programming = data.educational_links?.programming;
        if (programming) {
            console.log(`\n💻 كورسات البرمجة المتاحة:`);
            Object.entries(programming).forEach(([key, course]) => {
                if (course.title) {
                    console.log(`  - ${course.title}: ${course.url || course.urls?.[0] || 'رابط غير متوفر'}`);
                }
            });
        }

        // البحث عن جداول الكويزات
        const examInfo = data.schedules_sections?.exam_info;
        if (examInfo?.quiz_schedule) {
            console.log(`\n📋 جداول الكويزات:`);
            examInfo.quiz_schedule.forEach(quiz => {
                console.log(`  - ${quiz}`);
            });
        }

        // البحث عن النصائح الدراسية
        const studyTips = data.student_tips?.study_habits;
        if (studyTips) {
            console.log(`\n📖 نصائح دراسية:`);
            studyTips.forEach(tip => {
                console.log(`  - ${tip}`);
            });
        }

        // البحث عن المشاكل التقنية
        const excelIssue = data.technical_issues?.excel_2003;
        if (excelIssue) {
            console.log(`\n🛠️ حلول مشاكل Excel 2003:`);
            (excelIssue.solutions || []).forEach(solution => {
                console.log(`  - ${solution}`);
            });
        }

        console.log('\n✅ تم اختبار البيانات بنجاح!');

    } catch (error) {
        console.error('❌ خطأ في قراءة البيانات:', error.message);
    }
}

// تشغيل الاختبار
testUniversityData();
