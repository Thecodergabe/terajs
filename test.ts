import { signal } from "./src/reactivity/signal";
import { effect } from "./src/reactivity/effect";

const count = signal(0);

effect(() => {
    console.log("effect ran, count =", count());
});

console.log("initial:", count());
count.set(1);
count.set(2);
count.update(n => n + 1);
