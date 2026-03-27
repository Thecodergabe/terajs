import { state } from "./src/reactivity/state";
import { effect } from "./src/reactivity/effect";

const count = state(0);

effect(() => {
    console.log("effect run:", count.get());
});

count.set(1);
count.set(2);
count.set(3);