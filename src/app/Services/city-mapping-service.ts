import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
import { environment } from '../../environments/environment.development';

export interface City {
    id: number;
    name: string;
}

@Injectable({
    providedIn: 'root'
})
export class CityMappingService {
    private http = inject(HttpClient);
    private apiUrl = `${environment.apiUrl}/api/Client/cities`;

    // Cache cities to avoid multiple API calls
    private citiesCache$ = new BehaviorSubject<City[] | null>(null);

    // Fallback hardcoded cities (يستخدم لو API فشل)
    private fallbackCities: City[] = [
        { id: 20, name: 'Cairo' },
        { id: 21, name: 'Alexandria' },
        { id: 22, name: 'Giza' },
        { id: 23, name: 'New Cairo' },
        { id: 24, name: 'Sharm El Sheikh' },
        { id: 25, name: 'Hurghada' },
        { id: 26, name: 'Luxor' },
        { id: 27, name: 'Aswan' },
        { id: 28, name: 'Port Said' },
        { id: 29, name: 'Suez' },
        { id: 30, name: 'Mansoura' },
        { id: 31, name: 'Tanta' },
        { id: 32, name: 'Ismailia' },
    ];

    constructor() {
        // Load cities on service initialization
        this.loadCities();
    }

    /**
     * Load cities from backend API
     */
    private loadCities(): void {
        this.http.get<City[]>(this.apiUrl).pipe(
            tap(cities => {
                console.log('✅ Cities loaded from API:', cities.length);
                this.citiesCache$.next(cities);
            }),
            catchError(error => {
                console.warn('⚠️ Failed to load cities from API, using fallback:', error);
                this.citiesCache$.next(this.fallbackCities);
                return of(this.fallbackCities);
            })
        ).subscribe();
    }

    /**
     * Get all cities as Observable
     */
    getAllCities(): Observable<City[]> {
        const cached = this.citiesCache$.value;
        if (cached && cached.length > 0) {
            return of(cached);
        }

        return this.http.get<City[]>(this.apiUrl).pipe(
            tap(cities => this.citiesCache$.next(cities)),
            catchError(() => {
                this.citiesCache$.next(this.fallbackCities);
                return of(this.fallbackCities);
            })
        );
    }

    /**
     * Get City ID from name (case-insensitive)
     */
    getCityIdFromName(cityName: string | null | undefined): number | null {
        if (!cityName || cityName.trim() === '') {
            return null;
        }

        const cities = this.citiesCache$.value || this.fallbackCities;
        const searchTerm = cityName.toLowerCase().trim();

        const city = cities.find(c =>
            c.name.toLowerCase() === searchTerm ||
            c.name.toLowerCase().includes(searchTerm)
        );

        return city ? city.id : null;
    }

    /**
     * Get city name from ID
     */
    getCityNameFromId(cityId: number): string | null {
        const cities = this.citiesCache$.value || this.fallbackCities;
        const city = cities.find(c => c.id === cityId);
        return city ? city.name : null;
    }

    /**
     * Search cities by partial name
     */
    searchCities(query: string): City[] {
        const cities = this.citiesCache$.value || this.fallbackCities;

        if (!query || query.trim() === '') {
            return cities;
        }

        const searchTerm = query.toLowerCase().trim();
        return cities.filter(c =>
            c.name.toLowerCase().includes(searchTerm)
        );
    }

    /**
     * Refresh cities from API
     */
    refreshCities(): void {
        this.loadCities();
    }
}
