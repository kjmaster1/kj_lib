//
import {isEnvBrowser} from './misc';

/**
 * Simple wrapper around fetch API tailored for CEF/NUI use. This abstraction
 * can be extended to include AbortController if needed or if the response isn't
 * JSON. Tailor it to your needs.
 *
 * @param eventName - The endpoint eventname to target
 * @param data - Data you wish to send in the NUI Callback
 *
 * @return returnData - A promise for the data sent back by the NuiCallbacks CB argument
 */

// Capture the native fetch implementation for use in fetchNui
const resourceFetch = window.fetch;

// Only block browser fetch/XHR in the game environment.
// Vite needs these to function in the browser development environment.
if (!isEnvBrowser()) {
  // @ts-expect-error
  window.fetch = () => {};
  // @ts-expect-error
  window.XMLHttpRequest = window.fetch;
}

export async function fetchNui<T = any>(eventName: string, data?: any): Promise<T> {
  const options = {
    method: 'post',
    headers: {
      'Content-Type': 'application/json; charset=UTF-8',
    },
    body: JSON.stringify(data),
  };

  if (isEnvBrowser()) {
    console.log(`[NUI] Mock Fetch: ${eventName}`, data);
    return Promise.resolve({} as T);
  }

  const resourceName = (window as any).GetParentResourceName
    ? (window as any).GetParentResourceName()
    : 'nui-frame-app';

  // Use the captured resourceFetch instead of the potentially overridden global fetch
  const resp = await resourceFetch(`https://${resourceName}/${eventName}`, options);
  return await resp.json();
}
