#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
مساعد بيانات مجموعة واتساب جامعية
University WhatsApp Group Data Assistant

هذا السكريبت يساعد في البحث والاستعلام في بيانات مجموعة واتساب جامعية
منظمة بتنسيق JSON لتسهيل استخدامها من قبل الذكاء الاصطناعي.
"""

import json
import re
from typing import Dict, List, Any, Optional


class UniversityDataAssistant:
    """مساعد البيانات الجامعية"""

    def __init__(self, data_file: str = "whatsapp-university-data.json"):
        """تهيئة المساعد مع تحميل البيانات"""
        try:
            with open(data_file, 'r', encoding='utf-8') as f:
                self.data = json.load(f)
            print(f"تم تحميل البيانات بنجاح من {data_file}")
        except FileNotFoundError:
            print(f"خطأ: ملف البيانات غير موجود: {data_file}")
            self.data = {}
        except json.JSONDecodeError:
            print(f"خطأ: خطأ في قراءة ملف JSON: {data_file}")
            self.data = {}

    def search_links(self, query: str) -> Dict[str, Any]:
        """البحث في الروابط التعليمية"""
        results = {}
        query_lower = query.lower()

        # البحث في المواد البرمجية
        if any(word in query_lower for word in ['برمجة', 'programming', 'python', 'java', 'c++']):
            results['programming'] = self.data.get('educational_links', {}).get('programming', {})

        # البحث في المواد الأخرى
        if any(word in query_lower for word in ['شبكات', 'networks']):
            results['networks'] = self.data.get('educational_links', {}).get('networks', {})

        if any(word in query_lower for word in ['رياضيات', 'math', 'جبر', 'algebra']):
            results['mathematics'] = self.data.get('educational_links', {}).get('mathematics', {})

        return results

    def search_schedules(self, query: str) -> Dict[str, Any]:
        """البحث في الجداول والسكاشن"""
        query_lower = query.lower()
        schedules = self.data.get('schedules_sections', {})

        if any(word in query_lower for word in ['كويز', 'quiz', 'امتحان', 'exam']):
            return schedules.get('exam_info', {})

        if any(word in query_lower for word in ['محاضرة', 'lecture', 'جدول', 'schedule']):
            return schedules.get('academic_calendar', {})

        return schedules

    def search_tips(self, query: str) -> List[str]:
        """البحث في النصائح والخبرات"""
        query_lower = query.lower()
        tips = self.data.get('student_tips', {})

        if any(word in query_lower for word in ['دراسة', 'study', 'نصيحة', 'tip']):
            return tips.get('study_habits', []) + tips.get('recommended_professors', [])

        if any(word in query_lower for word in ['دكتور', 'professor', 'معيد', 'teacher']):
            return tips.get('recommended_professors', [])

        return tips.get('study_habits', [])

    def search_technical_help(self, query: str) -> Dict[str, Any]:
        """البحث في المساعدة التقنية"""
        query_lower = query.lower()

        if any(word in query_lower for word in ['excel', 'اكسل']):
            return self.data.get('technical_issues', {}).get('excel_2003', {})

        if any(word in query_lower for word in ['تحميل', 'download', 'مشكلة', 'problem']):
            return self.data.get('technical_issues', {})

        return {}

    def search_pdfs(self, subject: str) -> List[str]:
        """البحث في ملفات PDF"""
        pdfs = self.data.get('pdf_lectures', {})
        subject_lower = subject.lower()

        if 'رياضيات' in subject_lower or 'math' in subject_lower:
            return pdfs.get('mathematics', {}).get('math_0', []) + pdfs.get('mathematics', {}).get('math_1', [])

        if 'حاسب' in subject_lower or 'it' in subject_lower:
            return pdfs.get('computer_science', [])

        if 'إلكترونيك' in subject_lower or 'electronics' in subject_lower:
            return pdfs.get('electronics', [])

        return []

    def get_faq_answer(self, question: str) -> Optional[str]:
        """الحصول على إجابة من الأسئلة الشائعة"""
        faq = self.data.get('faq', [])
        question_lower = question.lower()

        for item in faq:
            if any(keyword in question_lower for keyword in item['question'].lower().split()):
                return item['answer']

        return None

    def comprehensive_search(self, query: str) -> Dict[str, Any]:
        """بحث شامل في جميع البيانات"""
        results = {
            'query': query,
            'educational_links': self.search_links(query),
            'schedules': self.search_schedules(query),
            'tips': self.search_tips(query),
            'technical_help': self.search_technical_help(query),
            'faq_answer': self.get_faq_answer(query)
        }

        # إزالة النتائج الفارغة
        results = {k: v for k, v in results.items() if v}

        return results


def main():
    """الوظيفة الرئيسية لاختبار المساعد"""
    assistant = UniversityDataAssistant()

    if not assistant.data:
        print("❌ فشل في تحميل البيانات")
        return

    print("🎓 مساعد بيانات مجموعة واتساب جامعية")
    print("=" * 50)

    # أمثلة على الاستعلامات
    test_queries = [
        "كورس برمجة بايثون",
        "متى كويز الرياضيات",
        "نصائح للدراسة",
        "مشكلة في Excel",
        "ملفات PDF الرياضيات"
    ]

    for query in test_queries:
        print(f"\n🔍 استعلام: {query}")
        results = assistant.comprehensive_search(query)

        if results:
            for key, value in results.items():
                if key != 'query' and value:
                    print(f"  📋 {key}: {value}")
        else:
            print("  ❌ لم يتم العثور على نتائج")

    print("\n✅ انتهى الاختبار")


if __name__ == "__main__":
    main()
