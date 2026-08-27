import React, { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext(null);

const TRANSLATIONS = {
  hi: {
    // Navigation & Sidebar
    'Dashboard': 'डैशबोर्ड',
    'Sales Deals': 'बिक्री सौदे',
    'Inventory': 'स्टॉक इन्वेंटरी',
    'Customers': 'ग्राहक',
    'AI Recommender': 'एआई सिफारिशें',
    'Churn Analytics': 'ग्राहक रिटेंशन',
    'Anomaly Alerts': 'सुरक्षा अलर्ट',
    'Business Setup': 'बिजनेस सेटअप',
    'Team & Performance': 'टीम एवं प्रदर्शन',
    'Reports & Forecasts': 'रिपोर्ट एवं पूर्वानुमान',
    'Settings': 'सेटिंग्स',
    'Boost': 'ग्रोथ',
    'Retention': 'रिटेंशन',
    'Safeguard': 'सुरक्षा',

    // Dashboards & Headers
    'Business Owner': 'बिजनेस मालिक',
    'Business Owner View': 'बिजनेस मालिक अवलोकन',
    'Owner Access': 'मालिक पहुंच',
    'Total Revenue': 'कुल राजस्व',
    'Total Orders': 'कुल ऑर्डर',
    'Active Customers': 'सक्रिय ग्राहक',
    'Average Order Value': 'औसत ऑर्डर मूल्य',
    'AI Strategic Insights Engine': 'एआई रणनीतिक अंतर्दृष्टि इंजन',
    'Real-time predictive insights from your recommendations, churn, and safeguard engines.': 'आपकी एआई सिफारिशों, रिटेंशन और सुरक्षा इंजनों से रीयल-टाइम जानकारी।',
    'Top Revenue Products': 'शीर्ष राजस्व उत्पाद',
    'Sales & Revenue Trend': 'बिक्री एवं राजस्व रुझान',
    'Category Distribution': 'श्रेणी वितरण',
    'View AI Bundles': 'एआई बंडल देखें',
    'View At-Risk Clients': 'जोखिम वाले ग्राहक देखें',
    'Review Safeguards': 'सुरक्षा अलर्ट जांचें',
    'Live AI Engine': 'लाइव एआई इंजन',

    // Inventory & PO
    'Store Manager Operations Dashboard': 'स्टोर मैनेजर ऑपरेशन्स डैशबोर्ड',
    'Create Purchase Order': 'नया परचेज ऑर्डर बनाएं',
    'Total Active SKUs': 'कुल सक्रिय उत्पाद (SKUs)',
    'Low Stock Alert': 'कम स्टॉक अलर्ट',
    'Out of Stock': 'आउट ऑफ स्टॉक',
    'Pending Shipments': 'पेंडिंग शिपमेंट',
    'Low Stock Priority Queue': 'कम स्टॉक प्राथमिकता सूची',
    'Real-Time Stock Inventory': 'रीयल-टाइम स्टॉक इन्वेंटरी',

    // Churn & Retention
    'At-Risk Customer Retention Center': 'ग्राहक रिटेंशन सेंटर',
    'Identify slipping accounts early and launch 1-click discount offers or executive calls to protect your revenue.': 'कम होते ग्राहकों को जल्दी पहचानें और 1-क्लिक ऑफर से अपना राजस्व बचाएं।',
    'Analyzed Accounts': 'विश्लेषण किए गए खाते',
    'High Risk Churn': 'उच्च जोखिम ग्राहक',
    'Revenue at Risk': 'जोखिम में राजस्व',
    'AI Retention Accuracy': 'एआई रिटेंशन सटीकता',

    // Safeguards
    'Business Safeguards & Fraud Protection': 'व्यापार सुरक्षा एवं धोखाधड़ी रोकथाम',
    'Automated safeguards scanning for unusual sales spikes, rapid stock depletion, and inventory leaks.': 'असामान्य बिक्री वृद्धि, तेजी से स्टॉक की कमी और रिसाव की स्वचालित जांच।',
    'Flagged Incidents': 'चिह्नित घटनाएं',
    'Critical Alerts': 'गंभीर अलर्ट',
    'Warning Anomalies': 'चेतावनी अलर्ट',
    'Unresolved Incidents': 'अनिर्णीत घटनाएं'
  }
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('marketmind.language') || 'en';
  });

  useEffect(() => {
    localStorage.setItem('marketmind.language', language);
  }, [language]);

  const t = (text, fallback) => {
    if (language === 'hi' && TRANSLATIONS.hi[text]) {
      return TRANSLATIONS.hi[text];
    }
    return fallback || text;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    return { language: 'en', setLanguage: () => {}, t: (str) => str };
  }
  return context;
};
