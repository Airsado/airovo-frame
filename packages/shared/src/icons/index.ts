import { _api, addCollection, type IconifyJSON } from "@iconify/vue";
import { readonly, shallowRef } from "vue";
import lucideCollection from "./lucide.json";

export interface LocalIconCollection {
  provider: string;
  prefix: string;
  title: string;
}

export interface RegisterIconCollectionOptions {
  provider?: string;
  title?: string;
}

const registeredCollections = shallowRef<LocalIconCollection[]>([]);

/** Registered local resources, shared by renderers and icon pickers. */
export const localIconCollections = readonly(registeredCollections);

/**
 * Register a trusted, application-bundled Iconify collection. Keep directory
 * metadata reactive: an already mounted picker can discover new resources.
 */
export function registerIconCollection(
  data: IconifyJSON,
  options: RegisterIconCollectionOptions = {},
): boolean {
  try {
    // Iconify treats an empty parser result as success for some malformed
    // inputs. Reject a missing icon dictionary before publishing it.
    if (
      !data ||
      typeof data !== "object" ||
      !data.icons ||
      typeof data.icons !== "object" ||
      Array.isArray(data.icons)
    )
      return false;
    const provider = options.provider ?? data.provider ?? "";
    if (!addCollection(data, provider)) return false;

    const collection: LocalIconCollection = {
      provider,
      prefix: data.prefix,
      title: options.title?.trim() || data.info?.name || data.prefix,
    };
    const previous = registeredCollections.value;
    const index = previous.findIndex(
      (item) =>
        item.provider === collection.provider &&
        item.prefix === collection.prefix,
    );
    registeredCollections.value =
      index === -1
        ? [...previous, collection]
        : previous.map((item, itemIndex) =>
            itemIndex === index ? collection : item,
          );
    return true;
  } catch {
    // A malformed collection must not replace a usable directory entry.
    return false;
  }
}

let registered = false;

export function registerLocalIcons(): void {
  if (registered) return;
  registered = registerIconCollection(lucideCollection, { title: "Lucide" });
}

registerLocalIcons();

/** Iconify exposes configuration lookup through its supported internal API. */
export const getAPIConfig = _api.getAPIConfig;

export {
  addAPIProvider,
  addCollection,
  addIcon,
  getIcon,
  Icon,
  iconExists,
  listIcons,
  loadIcon,
  loadIcons,
} from "@iconify/vue";
export type {
  IconifyAPIConfig,
  IconifyIcon,
  IconifyJSON,
  PartialIconifyAPIConfig,
} from "@iconify/vue";
