import { type Component, For } from 'solid-js';

export const Breadcrumb: Component<{ items: [name: string, link: string][] }> = props => {
    return (
        <ul class="container flex p-2 text-emerald-500">
            <For each={props.items}>
                {([name, link], n) => (
                    <li>
                        <span class="text-gray-700 tracking-tighter text-xs">{'//'}</span>
                        <a
                            href={link}
                            class="text-emerald-500 mx-3 border-emerald-500"
                            classList={{
                                'border-b': n() < props.items.length - 1
                            }}>
                            {name}
                        </a>
                    </li>
                )}
            </For>
        </ul>
    );
};
export default Breadcrumb;
