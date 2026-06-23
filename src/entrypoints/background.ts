export default defineBackground(() => {
    console.warn('Hello background!', { id: browser.runtime.id })
})
