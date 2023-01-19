import {Event} from "./event";
import {OnEvent} from "./on-event-filters";

const binarySearch = function (a: Event[], target: Event) {
  var l = 0,
    h = a.length - 1,
    m,
    comparison;
  let comparator = function (a: Event, b: Event) {
    return a.created_at - b.created_at;
  };
  while (l <= h) {
    m = (l + h) >>> 1; /* equivalent to Math.floor((l + h) / 2) but faster */
    comparison = comparator(a[m], target);
    if (comparison < 0) {
      l = m + 1;
    } else if (comparison > 0) {
      h = m - 1;
    } else {
      return m;
    }
  }
  return ~l;
};

const binaryInsert = function (a: Event[], target: Event) {
  const duplicate = true; // it's OK to have the same created_at multiple times
  var i = binarySearch(a, target);
  if (i >= 0) {
    /* if the binarySearch return value was zero or positive, a matching object was found */
    if (!duplicate) {
      return i;
    }
  } else {
    /* if the return value was negative, the bitwise complement of the return value is the correct index for this object */
    i = ~i;
  }
  a.splice(i, 0, target);
  return i;
};

export function collect(
  onEvents: (events: Event[]) => void,
  skipSort: boolean = false
): OnEvent {
  let events: Event[] = [];
  return (event: Event, afterEose: boolean, url: string | undefined) => {
    if (skipSort) {
      events.push(event);
    } else {
      binaryInsert(events, event);
    }
    onEvents(events);
  };
}
