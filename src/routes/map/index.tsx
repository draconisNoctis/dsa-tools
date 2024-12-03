import { action } from '@solidjs/router';
import { For, createResource } from 'solid-js';
import Nav from '~/components/Nav';
import type { NoDocumentMeta } from '~/server/utils/no-db';
import type { MapCreate } from '../../server/databases/map.db';

async function getMaps(): Promise<(NoDocumentMeta & { name: string })[]> {
    'use server';
    const { MapDb } = await import('../../server/databases/map.db');

    const maps = await MapDb.list();

    return maps.map(({ _id, _created, _updated, name }) => ({ _id, _created, _updated, name }));
}

async function createMap(values: MapCreate) {
    'use server';
    const { MapDb } = await import('../../server/databases/map.db');

    await MapDb.create(values);
}

export default function Map() {
    const [maps, { refetch }] = createResource(getMaps);

    let form: HTMLFormElement | undefined;

    const createMapAction = action(
        async (formData: FormData) => {
            await createMap({ name: formData.get('name') as string });
            refetch();
            form?.reset();
        },
        { name: 'createMapAction' }
    );

    return (
        <main class="text-center mx-auto  bg-gray-900 min-h-[100vh]">
            <Nav />
            <form ref={form} action={createMapAction} method="post" class="mt-8">
                <table class="table-fixed border-collapse w-full text-sm text-left bg-gradient-to-b from-gray-800 via-gray-600 to-gray-800">
                    <thead>
                        <tr>
                            <th class="border-b border-gray-500 font-medium p-2 pl-8 pt-6 pb-3 text-gray-200 text-left w-[50%]">Name</th>
                            <th class="border-b border-gray-500 font-medium p-2 pt-6 pb-3 text-gray-200 text-left">Created</th>
                            <th class="border-b border-gray-500 font-medium p-2 pt-6 pb-3 text-gray-200 text-left">Updated</th>
                            <th class="border-b border-gray-500 font-medium p-2 pr-8 pt-6 pb-3 text-gray-200 text-left">&nbsp</th>
                        </tr>
                    </thead>
                    <tbody class="bg-gray-600">
                        <For each={maps()}>
                            {map => (
                                <tr>
                                    <td class="border-b border-gray-500 p-2 pl-8 text-gray-200">
                                        <a href={`/map/${map._id}`}>{map.name}</a>
                                    </td>
                                    <td class="border-b border-gray-500 p-2 text-gray-200">{map._created}</td>
                                    <td class="border-b border-gray-500 p-2 text-gray-200">{map._updated}</td>
                                    <td class="border-b border-gray-500 p-2 pr-8 text-gray-200">
                                        <div class="flex gap-2">
                                            <a
                                                href={`/map/${map._id}`}
                                                class="bg-gray-500 rounded text-gray-200 px-4 py-2 w-[100%] text-center">
                                                Admin
                                            </a>
                                            <a
                                                href={`/map/${map._id}/preview`}
                                                target="_blank"
                                                class="bg-gray-500 rounded text-gray-200 px-4 py-2 w-[100%] text-center">
                                                Preview
                                            </a>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </For>
                    </tbody>
                    <tfoot>
                        <tr>
                            <td colspan="3" class="p-2 pl-8">
                                <input name="name" required class="w-[100%] px-4 py-2 bg-gray-200 text-gray-800 rounded" />
                            </td>
                            <td class="p-2 pr-8">
                                <button type="submit" class="bg-gray-500 rounded text-gray-200 px-4 py-2 w-[100%]">
                                    Create
                                </button>
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </form>
        </main>
    );
}
