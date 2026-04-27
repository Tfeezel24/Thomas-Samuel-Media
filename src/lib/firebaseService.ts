import {
    collection,
    doc,
    getDocs,
    getDoc,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    limit,
    startAfter,
    Timestamp,
    serverTimestamp,
    setDoc,
    writeBatch,
    type DocumentSnapshot,
} from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    sendSignInLinkToEmail,
    sendPasswordResetEmail,
    onAuthStateChanged,
    type User as FirebaseUser,
} from "firebase/auth";
import { db, auth, storage } from "./firebase";
import type {
    User,
    Client,
    Service,
    AddOn,
    Booking,
    Invoice,
    Project,
    PortfolioItem,
    Testimonial,
    CarouselVideo,
    ContactMessage,
    Payment,
} from "@/types";

// ─── Helper: Convert Firestore timestamps to Dates ────────────────────────
function convertTimestamps(data: Record<string, any>): Record<string, any> {
    const result: Record<string, any> = { ...data };
    for (const key of Object.keys(result)) {
        if (result[key] instanceof Timestamp) {
            result[key] = result[key].toDate();
        } else if (result[key] && typeof result[key] === "object" && !Array.isArray(result[key])) {
            result[key] = convertTimestamps(result[key]);
        }
    }
    return result;
}

/**
 * Normalizes a raw Firestore portfolio document to match the PortfolioItem shape.
 * Handles legacy bulk-imported docs that stored the image URL in 'url' instead of 'image',
 * and normalizes type='image' to type='photo'.
 */
function normalizePortfolioDoc(data: Record<string, any>): Record<string, any> {
    const d = { ...data };
    // Map legacy 'url' field → 'image' when 'image' is empty
    if (!d.image && d.url) {
        d.image = d.url;
    }
    // Normalize type='image' → type='photo'
    if (d.type === 'image') {
        d.type = 'photo';
    }
    return d;
}

// ─── AUTH SERVICE ──────────────────────────────────────────────────────────
export const authService = {
    // Sign up new user
    async register(email: string, password: string, profile: User["profile"]): Promise<User> {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        const userData: Omit<User, "id"> = {
            email,
            role: "client",
            profile,
            createdAt: new Date(),
        };
        await setDoc(doc(db, "users", cred.user.uid), {
            ...userData,
            createdAt: serverTimestamp(),
        });

        // Create associated client record
        await addDoc(collection(db, "clients"), {
            userId: cred.user.uid,
            source: 'website',
            notes: '',
            tags: ['new'],
            totalBookings: 0,
            totalRevenue: 0,
            preferredContact: 'email',
            createdAt: serverTimestamp(),
        });
        return { id: cred.user.uid, ...userData };
    },

    // Sign in
    async login(email: string, password: string): Promise<FirebaseUser> {
        const cred = await signInWithEmailAndPassword(auth, email, password);
        return cred.user;
    },

    // Sign out
    async logout(): Promise<void> {
        await signOut(auth);
    },

    // Send password reset email
    async resetPassword(email: string): Promise<void> {
        await sendPasswordResetEmail(auth, email);
    },

    // Send magic link
    async sendMagicLink(email: string): Promise<void> {
        await sendSignInLinkToEmail(auth, email, {
            url: window.location.origin,
            handleCodeInApp: true,
        });
        window.localStorage.setItem("emailForSignIn", email);
    },

    // Get user profile from Firestore
    async getUserProfile(uid: string): Promise<User | null> {
        const snap = await getDoc(doc(db, "users", uid));

        if (!snap.exists()) return null;
        return { id: snap.id, ...convertTimestamps(snap.data()) } as User;
    },

    // Listen to auth state
    onAuthChange(callback: (user: FirebaseUser | null) => void) {
        return onAuthStateChanged(auth, callback);
    },
};

// ─── SERVICES SERVICE ──────────────────────────────────────────────────────
export const servicesService = {
    async getAll(): Promise<Service[]> {
        const snap = await getDocs(
            query(collection(db, "services"), orderBy("sortOrder", "asc"))
        );
        return snap.docs.map((d) => ({ id: d.id, ...convertTimestamps(d.data()) } as Service));
    },

    async getById(id: string): Promise<Service | null> {
        const snap = await getDoc(doc(db, "services", id));
        if (!snap.exists()) return null;
        return { id: snap.id, ...convertTimestamps(snap.data()) } as Service;
    },

    async create(service: Omit<Service, "id">): Promise<string> {
        const ref = await addDoc(collection(db, "services"), service);
        return ref.id;
    },

    async update(id: string, data: Partial<Service>): Promise<void> {
        await updateDoc(doc(db, "services", id), data);
    },

    async delete(id: string): Promise<void> {
        await deleteDoc(doc(db, "services", id));
    },
};

// ─── ADD-ONS SERVICE ───────────────────────────────────────────────────────
export const addOnsService = {
    async getAll(): Promise<AddOn[]> {
        const snap = await getDocs(collection(db, "addons"));
        return snap.docs.map((d) => ({ id: d.id, ...convertTimestamps(d.data()) } as AddOn));
    },

    async getForService(serviceId: string): Promise<AddOn[]> {
        const snap = await getDocs(
            query(
                collection(db, "addons"),
                where("applicableServices", "array-contains", serviceId),
                where("isActive", "==", true)
            )
        );
        return snap.docs.map((d) => ({ id: d.id, ...convertTimestamps(d.data()) } as AddOn));
    },

    async create(addon: Omit<AddOn, "id">): Promise<string> {
        const ref = await addDoc(collection(db, "addons"), addon);
        return ref.id;
    },

    async update(id: string, data: Partial<AddOn>): Promise<void> {
        await updateDoc(doc(db, "addons", id), data);
    },

    async delete(id: string): Promise<void> {
        await deleteDoc(doc(db, "addons", id));
    },
};

// ─── BOOKINGS SERVICE ──────────────────────────────────────────────────────
export const bookingsService = {
    async getAll(): Promise<Booking[]> {
        const snap = await getDocs(
            query(collection(db, "bookings"), orderBy("createdAt", "desc"))
        );
        return snap.docs.map((d) => ({ id: d.id, ...convertTimestamps(d.data()) } as Booking));
    },

    async getByClient(clientId: string): Promise<Booking[]> {
        const snap = await getDocs(
            query(
                collection(db, "bookings"),
                where("clientId", "==", clientId),
                orderBy("createdAt", "desc")
            )
        );
        return snap.docs.map((d) => ({ id: d.id, ...convertTimestamps(d.data()) } as Booking));
    },

    async getByDate(date: Date): Promise<Booking[]> {
        const start = new Date(date);
        start.setHours(0, 0, 0, 0);
        const end = new Date(date);
        end.setHours(23, 59, 59, 999);

        const snap = await getDocs(
            query(
                collection(db, "bookings"),
                where("dateTime.start", ">=", Timestamp.fromDate(start)),
                where("dateTime.start", "<=", Timestamp.fromDate(end))
            )
        );
        return snap.docs.map((d) => ({ id: d.id, ...convertTimestamps(d.data()) } as Booking));
    },

    async create(booking: Omit<Booking, "id" | "createdAt">): Promise<string> {
        const ref = await addDoc(collection(db, "bookings"), {
            ...booking,
            status: booking.status || 'pending', // Use provided status or default to pending
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });
        return ref.id;
    },

    async updateStatus(id: string, status: string): Promise<void> {
        await updateDoc(doc(db, "bookings", id), {
            status,
            updatedAt: serverTimestamp(),
        });
    },

    async update(id: string, data: Partial<Booking>): Promise<void> {
        await updateDoc(doc(db, "bookings", id), {
            ...data,
            updatedAt: serverTimestamp(),
        });
    },

    async delete(id: string): Promise<void> {
        await deleteDoc(doc(db, "bookings", id));
    },
};

// ─── CLIENTS SERVICE ───────────────────────────────────────────────────────
export const clientsService = {
    async getAll(): Promise<Client[]> {
        const [clientsSnap, usersSnap] = await Promise.all([
            getDocs(query(collection(db, "clients"), orderBy("createdAt", "desc"))),
            getDocs(collection(db, "users"))
        ]);

        const usersMap = new Map();
        usersSnap.docs.forEach(d => {
            usersMap.set(d.id, { id: d.id, ...convertTimestamps(d.data()) });
        });

        // 1. Get existing real clients
        const clients = clientsSnap.docs.map((d) => {
            const clientData = { id: d.id, ...convertTimestamps(d.data()) } as Client;
            const user = usersMap.get(clientData.userId);
            if (user) {
                clientData.name = `${user.profile.firstName} ${user.profile.lastName}`;
                clientData.email = user.email;
            }
            return clientData;
        });

        // 2. Find orphan users (role='client' but no client doc)
        const linkedUserIds = new Set(clients.map(c => c.userId));

        usersMap.forEach((user) => {
            if (user.role === 'client' && !linkedUserIds.has(user.id)) {
                clients.push({
                    id: user.id, // Use user ID as client ID
                    userId: user.id,
                    source: 'website',
                    notes: 'From User Profile',
                    tags: ['legacy'],
                    totalBookings: 0,
                    totalRevenue: 0,
                    preferredContact: 'email',
                    createdAt: user.createdAt || new Date(),
                    name: `${user.profile.firstName} ${user.profile.lastName}`,
                    email: user.email
                } as Client);
            }
        });

        // Sort by most recent
        return clients.sort((a, b) => {
            const tA = a.createdAt instanceof Date ? a.createdAt.getTime() : new Date(a.createdAt).getTime();
            const tB = b.createdAt instanceof Date ? b.createdAt.getTime() : new Date(b.createdAt).getTime();
            return tB - tA;
        });
    },

    async getByUserId(userId: string): Promise<Client | null> {
        const snap = await getDocs(
            query(collection(db, "clients"), where("userId", "==", userId), limit(1))
        );
        if (snap.empty) return null;
        return { id: snap.docs[0].id, ...convertTimestamps(snap.docs[0].data()) } as Client;
    },

    async create(client: Omit<Client, "id">): Promise<string> {
        const ref = await addDoc(collection(db, "clients"), {
            ...client,
            createdAt: serverTimestamp(),
        });
        return ref.id;
    },

    async update(id: string, data: Partial<Client>): Promise<void> {
        await updateDoc(doc(db, "clients", id), data);
    },
};

// ─── INVOICES SERVICE ──────────────────────────────────────────────────────
export const invoicesService = {
    async getAll(): Promise<Invoice[]> {
        const snap = await getDocs(
            query(collection(db, "invoices"), orderBy("createdAt", "desc"))
        );
        return snap.docs.map((d) => ({ id: d.id, ...convertTimestamps(d.data()) } as Invoice));
    },

    async getByClient(clientId: string): Promise<Invoice[]> {
        const snap = await getDocs(
            query(
                collection(db, "invoices"),
                where("clientId", "==", clientId),
                orderBy("createdAt", "desc")
            )
        );
        return snap.docs.map((d) => ({ id: d.id, ...convertTimestamps(d.data()) } as Invoice));
    },

    async create(invoice: Omit<Invoice, "id" | "createdAt">): Promise<string> {
        const ref = await addDoc(collection(db, "invoices"), {
            ...invoice,
            createdAt: serverTimestamp(),
        });
        return ref.id;
    },

    async update(id: string, data: Partial<Invoice>): Promise<void> {
        await updateDoc(doc(db, "invoices", id), data);
    },

    async updateStatus(id: string, status: string): Promise<void> {
        await updateDoc(doc(db, "invoices", id), { status });
    },

    async delete(id: string): Promise<void> {
        await deleteDoc(doc(db, "invoices", id));
    },
};

// ─── PROJECTS SERVICE ──────────────────────────────────────────────────────
export const projectsService = {
    async getAll(): Promise<Project[]> {
        const snap = await getDocs(
            query(collection(db, "projects"), orderBy("createdAt", "desc"))
        );
        return snap.docs.map((d) => ({ id: d.id, ...convertTimestamps(d.data()) } as Project));
    },

    async getByClient(clientId: string): Promise<Project[]> {
        const snap = await getDocs(
            query(
                collection(db, "projects"),
                where("clientId", "==", clientId),
                orderBy("createdAt", "desc")
            )
        );
        return snap.docs.map((d) => ({ id: d.id, ...convertTimestamps(d.data()) } as Project));
    },

    async create(project: Omit<Project, "id" | "createdAt" | "updatedAt">): Promise<string> {
        const ref = await addDoc(collection(db, "projects"), {
            ...project,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });
        return ref.id;
    },

    async update(id: string, data: Partial<Project>): Promise<void> {
        await updateDoc(doc(db, "projects", id), {
            ...data,
            updatedAt: serverTimestamp(),
        });
    },

    async updateStatus(id: string, status: string): Promise<void> {
        await updateDoc(doc(db, "projects", id), {
            status,
            updatedAt: serverTimestamp(),
        });
    },

    async delete(id: string): Promise<void> {
        await deleteDoc(doc(db, "projects", id));
    },
};

// ─── PORTFOLIO SERVICE ─────────────────────────────────────────────────────
export const portfolioService = {
    async getAll(): Promise<PortfolioItem[]> {
        // No orderBy here — avoids requiring a Firestore composite index.
        // Sorting is done client-side by sortOrder after fetch.
        const snap = await getDocs(collection(db, "portfolio"));
        const items = snap.docs.map((d) => ({ id: d.id, ...normalizePortfolioDoc(convertTimestamps(d.data())) } as PortfolioItem));
        return items.sort((a, b) => (a.sortOrder ?? 999999) - (b.sortOrder ?? 999999));
    },

    // Paginated fetch — returns items + the last document snapshot for cursor.
    // In-memory cache: key → { items, lastDoc, hasMore, ts }
    _pageCache: new Map<string, { items: PortfolioItem[]; lastDoc: DocumentSnapshot | null; hasMore: boolean; ts: number }>(),
    _CACHE_TTL: 5 * 60 * 1000, // 5 minutes

    async getPage(
        pageSize: number,
        cursor?: DocumentSnapshot | null,
        filterType?: 'photo' | 'video',
        filterCategory?: string
    ): Promise<{ items: PortfolioItem[]; lastDoc: DocumentSnapshot | null; hasMore: boolean }> {
        const cacheKey = `${filterType}|${filterCategory ?? 'all'}|${pageSize}`;
        if (!cursor) {
            const cached = this._pageCache.get(cacheKey);
            if (cached && Date.now() - cached.ts < this._CACHE_TTL) {
                return { items: cached.items, lastDoc: cached.lastDoc, hasMore: cached.hasMore };
            }
        }

        const FETCH_SIZE = pageSize + 1;
        let snap;

        // ── Strategy A: Video tab with a specific category ──────────────────────
        // Uses composite index: category ASC + sortOrder ASC (already created)
        // Then client-side filters to only items with videoUrl.
        if (filterType === 'video' && filterCategory && filterCategory !== 'all') {
            try {
                const constraints: any[] = [
                    where("category", "==", filterCategory),
                    orderBy("sortOrder", "asc"),
                    limit(FETCH_SIZE * 5), // over-fetch since not all category items are videos
                ];
                if (cursor) constraints.push(startAfter(cursor));
                snap = await getDocs(query(collection(db, "portfolio"), ...constraints));
            } catch {
                const constraints: any[] = [where("category", "==", filterCategory), limit(FETCH_SIZE * 5)];
                if (cursor) constraints.push(startAfter(cursor));
                snap = await getDocs(query(collection(db, "portfolio"), ...constraints));
            }
            const videoDocs = snap.docs.filter(d => !!(d.data() as any).videoUrl);
            const hasMore = videoDocs.length > pageSize;
            const pageDocs = hasMore ? videoDocs.slice(0, pageSize) : videoDocs;
            const lastPageDoc = pageDocs.length > 0 ? pageDocs[pageDocs.length - 1] : null;
            const items = pageDocs.map(d => ({ id: d.id, ...normalizePortfolioDoc(convertTimestamps(d.data())) } as PortfolioItem));
            const result = { items, lastDoc: lastPageDoc, hasMore };
            if (!cursor) this._pageCache.set(cacheKey, { ...result, ts: Date.now() });
            return result;
        }

        // ── Strategy B: All Videos (no category filter) ──────────────────────────
        // Uses: where("videoUrl", "!=", "") + orderBy("videoUrl") + orderBy("sortOrder")
        // Requires a Firestore index: videoUrl ASC + sortOrder ASC
        // Falls back to fetching all docs and filtering client-side if index missing.
        if (filterType === 'video' && (!filterCategory || filterCategory === 'all')) {
            try {
                const constraints: any[] = [
                    where("videoUrl", "!=", ""),
                    orderBy("videoUrl", "asc"),
                    orderBy("sortOrder", "asc"),
                    limit(FETCH_SIZE),
                ];
                if (cursor) constraints.push(startAfter(cursor));
                snap = await getDocs(query(collection(db, "portfolio"), ...constraints));
                const allDocs = snap.docs;
                const hasMore = allDocs.length > pageSize;
                const pageDocs = hasMore ? allDocs.slice(0, pageSize) : allDocs;
                const lastPageDoc = pageDocs.length > 0 ? pageDocs[pageDocs.length - 1] : null;
                const items = pageDocs.map(d => ({ id: d.id, ...normalizePortfolioDoc(convertTimestamps(d.data())) } as PortfolioItem));
                const result = { items, lastDoc: lastPageDoc, hasMore };
                if (!cursor) this._pageCache.set(cacheKey, { ...result, ts: Date.now() });
                return result;
            } catch {
                // Index not yet ready — fall back to fetching a large batch and filtering client-side
                const LARGE_FETCH = 500;
                const constraints: any[] = [limit(LARGE_FETCH)];
                if (cursor) constraints.push(startAfter(cursor));
                snap = await getDocs(query(collection(db, "portfolio"), ...constraints));
                const videoDocs = snap.docs.filter(d => !!(d.data() as any).videoUrl);
                const hasMore = videoDocs.length > pageSize;
                const pageDocs = hasMore ? videoDocs.slice(0, pageSize) : videoDocs;
                const lastPageDoc = pageDocs.length > 0 ? pageDocs[pageDocs.length - 1] : null;
                const items = pageDocs.map(d => ({ id: d.id, ...normalizePortfolioDoc(convertTimestamps(d.data())) } as PortfolioItem));
                const result = { items, lastDoc: lastPageDoc, hasMore };
                if (!cursor) this._pageCache.set(cacheKey, { ...result, ts: Date.now() });
                return result;
            }
        }

        // ── Strategy C: Photo tab (with or without category) ─────────────────────
        // Uses composite index: category ASC + sortOrder ASC (already created)
        const qConstraints: any[] = [];
        if (filterCategory && filterCategory !== 'all') {
            qConstraints.push(where("category", "==", filterCategory));
        }
        // Over-fetch by 4x so that client-side filtering (video items excluded) still
        // leaves enough docs to correctly determine hasMore.
        const PHOTO_FETCH = FETCH_SIZE * 4;
        qConstraints.push(orderBy("sortOrder", "asc"), limit(PHOTO_FETCH));
        if (cursor) qConstraints.push(startAfter(cursor));

        try {
            snap = await getDocs(query(collection(db, "portfolio"), ...qConstraints));
        } catch {
            const fallback: any[] = [];
            if (filterCategory && filterCategory !== 'all') {
                fallback.push(where("category", "==", filterCategory));
            }
            fallback.push(limit(PHOTO_FETCH));
            if (cursor) fallback.push(startAfter(cursor));
            snap = await getDocs(query(collection(db, "portfolio"), ...fallback));
        }

        const allDocs = snap.docs;
        // For photo tab: exclude items that have a videoUrl
        const filteredDocs = filterType === 'photo'
            ? allDocs.filter(d => !(d.data() as any).videoUrl && !!(d.data() as any).image)
            : allDocs;

        const hasMore = filteredDocs.length > pageSize;
        const pageDocs = hasMore ? filteredDocs.slice(0, pageSize) : filteredDocs;
        const lastPageDoc = pageDocs.length > 0 ? pageDocs[pageDocs.length - 1] : null;
        const items = pageDocs.map(d => ({ id: d.id, ...normalizePortfolioDoc(convertTimestamps(d.data())) } as PortfolioItem));
        const result = { items, lastDoc: lastPageDoc, hasMore };
        if (!cursor) this._pageCache.set(cacheKey, { ...result, ts: Date.now() });
        return result;
    },

    // Call this after any create/update/delete to invalidate stale cache
    invalidateCache() {
        this._pageCache.clear();
    },

    async getFeatured(): Promise<PortfolioItem[]> {
        // No orderBy here — avoids requiring a composite index for (featured, date).
        // Sorting is done client-side by sortOrder after fetch.
        const snap = await getDocs(
            query(
                collection(db, "portfolio"),
                where("featured", "==", true)
            )
        );
        const items = snap.docs.map((d) => ({ id: d.id, ...normalizePortfolioDoc(convertTimestamps(d.data())) } as PortfolioItem));
        return items.sort((a, b) => (a.sortOrder ?? 999999) - (b.sortOrder ?? 999999));
    },

    async create(item: Omit<PortfolioItem, "id">): Promise<string> {
        const ref = await addDoc(collection(db, "portfolio"), {
            ...item,
            date: item.date instanceof Date ? Timestamp.fromDate(item.date) : item.date,
        });
        return ref.id;
    },

    async update(id: string, data: Partial<PortfolioItem>): Promise<void> {
        const updateData: any = {};
        
        // Only include valid fields to avoid Firestore errors with undefined values
        const validFields = ['title', 'category', 'type', 'image', 'videoUrl', 'thumbnail', 'description', 'client', 'date', 'featured', 'sortOrder'];
        
        Object.keys(data).forEach(key => {
            if (validFields.includes(key) && (data as any)[key] !== undefined) {
                updateData[key] = (data as any)[key];
            }
        });

        if (updateData.date && updateData.date instanceof Date) {
            updateData.date = Timestamp.fromDate(updateData.date);
        }
        
        // If id is present in updateData (from spreading an item), remove it as updateDoc doesn't want it
        delete updateData.id;

        await updateDoc(doc(db, "portfolio", id), updateData);
    },

    async delete(id: string): Promise<void> {
        await deleteDoc(doc(db, "portfolio", id));
    },
    // Batch-update sortOrder for multiple items in a single Firestore write
    async batchUpdateSortOrder(updates: { id: string; sortOrder: number }[]): Promise<void> {
        const batch = writeBatch(db);
        for (const { id, sortOrder } of updates) {
            batch.update(doc(db, "portfolio", id), { sortOrder });
        }
        await batch.commit();
        this.invalidateCache();
    },
};

// ─── PORTFOLIO CATEGORIES SERVICE ─────────────────────────────────────────
const CATEGORIES_DOC = 'portfolioCategories';
const DEFAULT_CATEGORIES = ['fashion', 'headshots-and-portraits', 'food', 'events', 'brand-video', 'travel-video', 'events-video', 'real-estate', 'bts'];

export const portfolioCategoriesService = {
    async getAll(): Promise<string[]> {
        // Try both camelCase and snake_case for backward compatibility
        const [snap1, snap2] = await Promise.all([
            getDoc(doc(db, 'settings', CATEGORIES_DOC)),
            getDoc(doc(db, 'settings', 'portfolio_categories'))
        ]);
        
        if (snap1.exists()) {
            const data = snap1.data();
            return Array.isArray(data.categories) ? data.categories : DEFAULT_CATEGORIES;
        }
        if (snap2.exists()) {
            const data = snap2.data();
            return Array.isArray(data.categories) ? data.categories : DEFAULT_CATEGORIES;
        }
        
        // First time: seed defaults
        await setDoc(doc(db, 'settings', CATEGORIES_DOC), { categories: DEFAULT_CATEGORIES });
        return DEFAULT_CATEGORIES;
    },

    async save(categories: string[]): Promise<void> {
        // Save to both for safety during migration
        await Promise.all([
            setDoc(doc(db, 'settings', CATEGORIES_DOC), { categories }),
            setDoc(doc(db, 'settings', 'portfolio_categories'), { categories })
        ]);
    },
};

// ─── TESTIMONIALS SERVICE ──────────────────────────────────────────────────
export const testimonialsService = {
    async getAll(): Promise<Testimonial[]> {
        const snap = await getDocs(
            query(collection(db, "testimonials"), orderBy("createdAt", "desc"))
        );
        return snap.docs.map((d) => ({ id: d.id, ...convertTimestamps(d.data()) } as Testimonial));
    },

    async create(testimonial: Omit<Testimonial, "id" | "createdAt" | "status">): Promise<string> {
        const ref = await addDoc(collection(db, "testimonials"), {
            ...testimonial,
            status: "pending",
            createdAt: serverTimestamp(),
        });
        return ref.id;
    },

    async update(id: string, data: Partial<Testimonial>): Promise<void> {
        await updateDoc(doc(db, "testimonials", id), data);
    },

    async delete(id: string): Promise<void> {
        await deleteDoc(doc(db, "testimonials", id));
    },
};

// ─── CAROUSEL VIDEOS SERVICE ───────────────────────────────────────────────
export const carouselVideosService = {
    async getAll(): Promise<CarouselVideo[]> {
        const snap = await getDocs(
            query(collection(db, "carouselVideos"), orderBy("sortOrder", "asc"))
        );
        return snap.docs.map((d) => ({ id: d.id, ...convertTimestamps(d.data()) } as CarouselVideo));
    },

    async getActive(): Promise<CarouselVideo[]> {
        const snap = await getDocs(
            query(
                collection(db, "carouselVideos"),
                where("isActive", "==", true)
            )
        );
        const videos = snap.docs.map((d) => ({ id: d.id, ...convertTimestamps(d.data()) } as CarouselVideo));
        return videos.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
    },

    async create(video: Omit<CarouselVideo, "id" | "createdAt">): Promise<string> {
        const ref = await addDoc(collection(db, "carouselVideos"), {
            ...video,
            createdAt: serverTimestamp(),
        });
        return ref.id;
    },

    async update(id: string, data: Partial<CarouselVideo>): Promise<void> {
        await updateDoc(doc(db, "carouselVideos", id), data);
    },

    async delete(id: string): Promise<void> {
        await deleteDoc(doc(db, "carouselVideos", id));
    },
};

// ─── CONTACT MESSAGES SERVICE ──────────────────────────────────────────────
export const contactMessagesService = {
    async getAll(): Promise<ContactMessage[]> {
        const snap = await getDocs(
            query(collection(db, "contactMessages"), orderBy("createdAt", "desc"))
        );
        return snap.docs.map((d) => ({ id: d.id, ...convertTimestamps(d.data()) } as ContactMessage));
    },

    async create(message: Omit<ContactMessage, "id" | "createdAt" | "isRead">): Promise<string> {
        const ref = await addDoc(collection(db, "contactMessages"), {
            ...message,
            isRead: false,
            createdAt: serverTimestamp(),
        });
        return ref.id;
    },

    async markAsRead(id: string): Promise<void> {
        await updateDoc(doc(db, "contactMessages", id), { isRead: true });
    },

    async markAsUnread(id: string): Promise<void> {
        await updateDoc(doc(db, "contactMessages", id), { isRead: false });
    },

    async delete(id: string): Promise<void> {
        await deleteDoc(doc(db, "contactMessages", id));
    },

    async getUnreadCount(): Promise<number> {
        const snap = await getDocs(
            query(collection(db, "contactMessages"), where("isRead", "==", false))
        );
        return snap.size;
    },
};

// ─── PAYMENTS SERVICE ──────────────────────────────────────────────────────
export const paymentsService = {
    async getAll(): Promise<Payment[]> {
        const snap = await getDocs(
            query(collection(db, "payments"), orderBy("created", "desc"))
        );
        return snap.docs.map((d) => ({ id: d.id, ...convertTimestamps(d.data()) } as Payment));
    },

    async getByInvoice(invoiceId: string): Promise<Payment[]> {
        const snap = await getDocs(
            query(
                collection(db, "payments"),
                where("invoiceId", "==", invoiceId),
                orderBy("created", "desc")
            )
        );
        return snap.docs.map((d) => ({ id: d.id, ...convertTimestamps(d.data()) } as Payment));
    },
};

// ─── STORAGE SERVICE ───────────────────────────────────────────────────────
export const storageService = {
    async uploadFile(file: File, path: string): Promise<string> {
        const storageRef = ref(storage, `${path}/${Date.now()}_${file.name}`);
        const uploadTask = uploadBytesResumable(storageRef, file);

        return new Promise((resolve, reject) => {
            uploadTask.on('state_changed',
                (snapshot) => {
                    // Observe state change events such as progress, pause, and resume
                    // Get task progress, including the number of bytes uploaded and the total number of bytes to be uploaded
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    console.log('Upload is ' + progress + '% done');
                },
                (error) => {
                    // Handle unsuccessful uploads
                    reject(error);
                },
                () => {
                    // Handle successful uploads on complete
                    // For instance, get the download URL: https://firebasestorage.googleapis.com/...
                    getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
                        resolve(downloadURL);
                    });
                }
            );
        });
    }
};

// ─── SEED DATA ─────────────────────────────────────────────────────────────
// Utility to seed Firestore with mock data for initial setup
export async function seedFirestore(): Promise<void> {
    const { services, addOns, portfolioItems, testimonials, mockClients, mockBookings, mockInvoices, mockProjects } = await import("@/data/mockData");

    console.log("Seeding Firestore...");

    // Function to seed a collection if empty
    const seedIfEmpty = async (collName: string, dataArray: any[]) => {
        const snap = await getDocs(query(collection(db, collName), limit(1)));
        if (snap.empty) {
            console.log(`Seeding ${collName}...`);
            for (const item of dataArray) {
                const { id, ...data } = item;
                // Handle Dates vs Timestamps
                const processedData = { ...data };
                if (processedData.date && processedData.date instanceof Date) {
                    processedData.date = Timestamp.fromDate(processedData.date);
                }
                if (processedData.createdAt && processedData.createdAt instanceof Date) {
                    processedData.createdAt = Timestamp.fromDate(processedData.createdAt);
                }
                if (processedData.dateTime?.start && processedData.dateTime.start instanceof Date) {
                    processedData.dateTime.start = Timestamp.fromDate(processedData.dateTime.start);
                }
                if (processedData.dateTime?.end && processedData.dateTime.end instanceof Date) {
                    processedData.dateTime.end = Timestamp.fromDate(processedData.dateTime.end);
                }
                if (processedData.dueDate && processedData.dueDate instanceof Date) {
                    processedData.dueDate = Timestamp.fromDate(processedData.dueDate);
                }

                if (id) {
                    await setDoc(doc(db, collName, id), processedData);
                } else {
                    await addDoc(collection(db, collName), processedData);
                }
            }
            return true;
        }
        return false;
    };

    await seedIfEmpty("services", services);
    await seedIfEmpty("addons", addOns);
    await seedIfEmpty("portfolio", portfolioItems);
    await seedIfEmpty("testimonials", testimonials);
    await seedIfEmpty("clients", mockClients);
    await seedIfEmpty("bookings", mockBookings);
    await seedIfEmpty("invoices", mockInvoices);
    await seedIfEmpty("projects", mockProjects);

    console.log("Firestore seeding check complete!");
}
