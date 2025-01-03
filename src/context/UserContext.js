import React, { createContext, useState, useEffect } from "react";
import { auth, db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(async (user) => {
            if (user) {
                // Kullanıcı bilgilerini Firestore'dan al
                const userDoc = await getDoc(doc(db, 'users', user.uid));
                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    setIsAdmin(userData.role === 'admin');
                }
                setUser(user);
            } else {
                setUser(null);
                setIsAdmin(false);
            }
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    if (loading) {
        return <div className="loading">Yükleniyor...</div>;
    }

    return (
        <UserContext.Provider value={{ user, isAdmin }}>
            {children}
        </UserContext.Provider>
    );
};
