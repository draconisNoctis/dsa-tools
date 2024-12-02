import { action } from '@solidjs/router';
import { For, createResource } from 'solid-js';
import type { MapCreate } from '../../server/databases/map.db';

async function getMaps(): Promise<{ _id: string; name: string }[]> {
    'use server';
    const { MapDb } = await import('../../server/databases/map.db');

    const maps = await MapDb.list();

    return maps.map(({ _id, name }) => ({ _id, name }));
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
        <main class="text-center mx-auto text-gray-950 bg-gray-500 p-4 m-4">
            <form ref={form} action={createMapAction} method="post">
                <table class="table-fixed">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Name</th>
                            <th>&nbsp</th>
                        </tr>
                    </thead>
                    <tbody>
                        <For each={maps()}>
                            {map => (
                                <tr>
                                    <td>
                                        <a href={`/map/${map._id}`}>{map._id}</a>
                                    </td>
                                    <td>
                                        <a href={`/map/${map._id}`}>{map.name}</a>
                                    </td>
                                </tr>
                            )}
                        </For>
                    </tbody>
                    <tfoot>
                        <tr>
                            <td>&nbsp;</td>
                            <td>
                                <input name="name" required />
                            </td>
                            <td>
                                <button type="submit">Create</button>
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </form>
        </main>
    );
}
