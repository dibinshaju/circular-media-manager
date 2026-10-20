#include "cdll.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <ctype.h>

/* Helper to convert string to lowercase for case-insensitive searching */
static void to_lowercase(char* dest, const char* src, size_t max_len) {
    size_t i = 0;
    while (src[i] != '\0' && i < max_len - 1) {
        dest[i] = (char)tolower((unsigned char)src[i]);
        i++;
    }
    dest[i] = '\0';
}

/* Helper to allocate and populate a single MediaNode */
static MediaNode* node_create(const char* id, const char* title, const char* artist, 
                              MediaType type, const char* source) {
    MediaNode* node = (MediaNode*)malloc(sizeof(MediaNode));
    if (!node) {
        return NULL;
    }

    /* Safely copy strings with guaranteed null-termination */
    snprintf(node->id, sizeof(node->id), "%s", id ? id : "");
    snprintf(node->title, sizeof(node->title), "%s", title ? title : "");
    snprintf(node->artist, sizeof(node->artist), "%s", artist ? artist : "");
    node->type = type;
    snprintf(node->source, sizeof(node->source), "%s", source ? source : "");

    node->next = NULL;
    node->prev = NULL;
    return node;
}

CircularPlaylist* playlist_create(void) {
    CircularPlaylist* list = (CircularPlaylist*)malloc(sizeof(CircularPlaylist));
    if (!list) {
        return NULL;
    }
    list->head = NULL;
    list->current = NULL;
    list->count = 0;
    return list;
}

int playlist_add(CircularPlaylist* list, const char* id, const char* title, 
                 const char* artist, MediaType type, const char* source) {
    if (!list) return 0;

    MediaNode* newNode = node_create(id, title, artist, type, source);
    if (!newNode) return 0;

    if (list->count == 0 || !list->head) {
        /* Invariant for single node: points to itself in both directions */
        list->head = newNode;
        list->current = newNode;
        newNode->next = newNode;
        newNode->prev = newNode;
    } else {
        /* Append to tail: tail is directly accessible via head->prev in O(1) */
        MediaNode* tail = list->head->prev;
        tail->next = newNode;
        newNode->prev = tail;
        newNode->next = list->head;
        list->head->prev = newNode;
    }

    list->count++;
    return 1;
}

int playlist_insert_after(CircularPlaylist* list, const char* target_id, 
                          const char* id, const char* title, const char* artist, 
                          MediaType type, const char* source) {
    if (!list || !target_id) return 0;

    MediaNode* target = playlist_find(list, target_id);
    if (!target) return 0;

    MediaNode* newNode = node_create(id, title, artist, type, source);
    if (!newNode) return 0;

    MediaNode* nextNode = target->next;

    target->next = newNode;
    newNode->prev = target;
    newNode->next = nextNode;
    nextNode->prev = newNode;

    list->count++;
    return 1;
}

int playlist_remove(CircularPlaylist* list, const char* id) {
    if (!list || list->count == 0 || !list->head || !id) {
        return 0;
    }

    MediaNode* target = playlist_find(list, id);
    if (!target) {
        return 0;
    }

    if (list->count == 1) {
        list->head = NULL;
        list->current = NULL;
        free(target);
        list->count = 0;
        return 1;
    }

    MediaNode* prevNode = target->prev;
    MediaNode* nextNode = target->next;

    /* Re-wire neighboring nodes */
    prevNode->next = nextNode;
    nextNode->prev = prevNode;

    /* If the removed node was head, update head to successor */
    if (list->head == target) {
        list->head = nextNode;
    }

    /* If the removed node was current, advance current to successor */
    if (list->current == target) {
        list->current = nextNode;
    }

    /* Disconnect and free memory */
    target->next = NULL;
    target->prev = NULL;
    free(target);
    list->count--;

    return 1;
}

MediaNode* playlist_next(CircularPlaylist* list) {
    if (!list || !list->current) return NULL;
    list->current = list->current->next;
    return list->current;
}

MediaNode* playlist_previous(CircularPlaylist* list) {
    if (!list || !list->current) return NULL;
    list->current = list->current->prev;
    return list->current;
}

MediaNode* playlist_select(CircularPlaylist* list, const char* id) {
    if (!list || !id) return NULL;
    MediaNode* node = playlist_find(list, id);
    if (node) {
        list->current = node;
        return node;
    }
    return NULL;
}

MediaNode* playlist_find(const CircularPlaylist* list, const char* id) {
    if (!list || list->count == 0 || !list->head || !id) return NULL;

    MediaNode* curr = list->head;
    for (int i = 0; i < list->count; i++) {
        if (strcmp(curr->id, id) == 0) {
            return curr;
        }
        curr = curr->next;
    }
    return NULL;
}

int playlist_search(const CircularPlaylist* list, const char* query, 
                    MediaNode** results, int max_results) {
    if (!list || list->count == 0 || !list->head || !query || !results || max_results <= 0) {
        return 0;
    }

    char query_lower[128];
    to_lowercase(query_lower, query, sizeof(query_lower));

    int match_count = 0;
    MediaNode* curr = list->head;

    for (int i = 0; i < list->count && match_count < max_results; i++) {
        char title_lower[128];
        char artist_lower[128];
        to_lowercase(title_lower, curr->title, sizeof(title_lower));
        to_lowercase(artist_lower, curr->artist, sizeof(artist_lower));

        if (strstr(title_lower, query_lower) != NULL || strstr(artist_lower, query_lower) != NULL) {
            results[match_count++] = curr;
        }
        curr = curr->next;
    }

    return match_count;
}

void playlist_display(const CircularPlaylist* list) {
    if (!list || list->count == 0 || !list->head) {
        printf("\n[Circular Playlist is EMPTY (Count: 0)]\n");
        return;
    }

    printf("\n============================================================================================================\n");
    printf(" CIRCULAR DOUBLY LINKED LIST SNAPSHOT  (Total Count: %d)\n", list->count);
    printf("============================================================================================================\n");
    printf(" %-4s | %-16s | %-24s | %-16s | %-6s | %-14s | %-14s\n", 
           "Idx", "Node Addr", "Title", "Artist", "Type", "Prev Title", "Next Title");
    printf("------------------------------------------------------------------------------------------------------------\n");

    MediaNode* curr = list->head;
    for (int i = 0; i < list->count; i++) {
        const char* type_str = (curr->type == MEDIA_TYPE_VIDEO) ? "VIDEO" : "AUDIO";
        char marker[16] = "";

        if (curr == list->head && curr == list->current) {
            snprintf(marker, sizeof(marker), " [HEAD/CURR]");
        } else if (curr == list->head) {
            snprintf(marker, sizeof(marker), " [HEAD]");
        } else if (curr == list->current) {
            snprintf(marker, sizeof(marker), " [CURRENT]");
        } else if (curr == list->head->prev) {
            snprintf(marker, sizeof(marker), " [TAIL]");
        }

        char title_buf[160];
        snprintf(title_buf, sizeof(title_buf), "%s%s", curr->title, marker);

        printf(" %-4d | %-16p | %-24.24s | %-16.16s | %-6s | %-14.14s | %-14.14s\n",
               i + 1,
               (void*)curr,
               title_buf,
               curr->artist,
               type_str,
               curr->prev ? curr->prev->title : "(null)",
               curr->next ? curr->next->title : "(null)");

        curr = curr->next;
    }
    printf("============================================================================================================\n");
    printf(" Tail (%p) -> next points to Head (%p)\n", (void*)list->head->prev, (void*)list->head);
    printf(" Head (%p) -> prev points to Tail (%p)\n", (void*)list->head, (void*)list->head->prev);
    printf(" Current Selected Node: [%s] (%p)\n", 
           list->current ? list->current->title : "None", 
           (void*)list->current);
    printf("============================================================================================================\n\n");
}

void playlist_clear(CircularPlaylist* list) {
    if (!list || list->count == 0 || !list->head) return;

    MediaNode* curr = list->head;
    int remaining = list->count;

    for (int i = 0; i < remaining; i++) {
        MediaNode* nextNode = curr->next;
        curr->next = NULL;
        curr->prev = NULL;
        free(curr);
        curr = nextNode;
    }

    list->head = NULL;
    list->current = NULL;
    list->count = 0;
}

void playlist_destroy(CircularPlaylist* list) {
    if (!list) return;
    playlist_clear(list);
    free(list);
}

int playlist_validate_integrity(const CircularPlaylist* list, char* err_buf, size_t err_buf_size) {
    if (!list) {
        if (err_buf) snprintf(err_buf, err_buf_size, "List pointer is NULL");
        return 0;
    }

    /* Invariant 1: Empty list state */
    if (list->count == 0) {
        if (list->head != NULL || list->current != NULL) {
            if (err_buf) snprintf(err_buf, err_buf_size, "Empty list has non-null head or current pointer");
            return 0;
        }
        return 1; /* Valid empty list */
    }

    /* Invariant 2: Non-empty list must have non-null head and current */
    if (!list->head) {
        if (err_buf) snprintf(err_buf, err_buf_size, "Non-empty list has NULL head pointer");
        return 0;
    }
    if (!list->current) {
        if (err_buf) snprintf(err_buf, err_buf_size, "Non-empty list has NULL current pointer");
        return 0;
    }

    /* Invariant 3: Tail-to-head circular connection */
    MediaNode* tail = list->head->prev;
    if (!tail) {
        if (err_buf) snprintf(err_buf, err_buf_size, "head->prev (tail) is NULL");
        return 0;
    }
    if (tail->next != list->head) {
        if (err_buf) snprintf(err_buf, err_buf_size, "tail->next (%p) does not point to head (%p)", 
                              (void*)tail->next, (void*)list->head);
        return 0;
    }

    /* Invariant 4: Forward bidirectional link check */
    MediaNode* curr = list->head;
    int steps = 0;
    bool current_found = false;

    while (steps < list->count + 2) {
        if (curr == list->current) {
            current_found = true;
        }

        if (!curr->next) {
            if (err_buf) snprintf(err_buf, err_buf_size, "Node %s has NULL next pointer", curr->id);
            return 0;
        }
        if (curr->next->prev != curr) {
            if (err_buf) snprintf(err_buf, err_buf_size, "Bidirectional link broken: node %s->next->prev != node", curr->id);
            return 0;
        }

        if (!curr->prev) {
            if (err_buf) snprintf(err_buf, err_buf_size, "Node %s has NULL prev pointer", curr->id);
            return 0;
        }
        if (curr->prev->next != curr) {
            if (err_buf) snprintf(err_buf, err_buf_size, "Reverse link broken: node %s->prev->next != node", curr->id);
            return 0;
        }

        steps++;
        curr = curr->next;
        if (curr == list->head) {
            break;
        }
    }

    if (steps != list->count) {
        if (err_buf) snprintf(err_buf, err_buf_size, "Traversed step count (%d) does not match recorded count (%d)", 
                              steps, list->count);
        return 0;
    }

    if (!current_found) {
        if (err_buf) snprintf(err_buf, err_buf_size, "Current pointer (%p) is unreachable in circular traversal", 
                              (void*)list->current);
        return 0;
    }

    return 1; /* All invariants verified successfully */
}
