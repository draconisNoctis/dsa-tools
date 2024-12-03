import AventuriaMap from '~/assets/images/AventuriaMap.jpg';
import Breadcrumb from '~/components/Breadcrumb';
import Nav from '~/components/Nav';

export default function Home() {
    return (
        <main class="bg-gray-900 min-h-[100vh]">
            <Nav />
            <Breadcrumb items={[['Home', '/']]} />

            <div class="grid grid-cols-3 gap-4 max-w-[1000px] mx-auto">
                <a
                    href="/map"
                    class="border-2 border-emerald-900 shadow-none hover:border-emerald-600 hover:shadow-md hover:shadow-emerald-600 hover:translate-y-[-4px] hover:scale-105 transition-all rounded-3xl overflow-hidden bg-center bg-[length:800px]"
                    style={{ 'background-image': `url('${AventuriaMap}')` }}>
                    <h1 class="text-center text-4xl leading-[3] backdrop-blur-sm backdrop-brightness-50">Maps</h1>
                    <p class="bg-emerald-950 p-4">Share your maps with your players in a PnP session</p>
                </a>
            </div>
        </main>
    );
}
