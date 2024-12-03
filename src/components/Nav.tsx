import { useLocation } from '@solidjs/router';

export default function Nav() {
    const location = useLocation();
    const active = (path: string) => (path === location.pathname ? 'border-emerald-600' : 'border-transparent hover:border-emerald-600');
    return (
        <nav class="bg-emerald-900">
            <ul class="container flex items-center p-3 text-gray-200">
                <li class={`border-b-2 ${active('/')} mx-1.5 sm:mx-6 transition-colors`}>
                    <a href="/">Home</a>
                </li>
                <li class={`border-b-2 ${active('/map')} mx-1.5 sm:mx-6 transition-colors`}>
                    <a href="/map">Map</a>
                </li>
            </ul>
        </nav>
    );
}
