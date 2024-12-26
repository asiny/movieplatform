import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyCzwGkSaeyxmimzT6892hthThSJOhDh2dg",
    authDomain: "movierecommend-e9006.firebaseapp.com",
    projectId: "movierecommend-e9006",
    storageBucket: "movierecommend-e9006.appspot.com",
    messagingSenderId: "274239659123",
    appId: "1:274239659123:web:ed89a55f530a8a55e05e06",
    measurementId: "G-7L8X6796TM"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };
