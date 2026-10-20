#include "cdll.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

static void trim_newline(char* str) {
    size_t len = strlen(str);
    if (len > 0 && str[len - 1] == '\n') {
        str[len - 1] = '\0';
    }
}

static void read_string(const char* prompt, char* buffer, size_t size) {
    printf("%s", prompt);
    if (fgets(buffer, (int)size, stdin) != NULL) {
        trim_newline(buffer);
    }
}

static void seed_sample_data(CircularPlaylist* list) {
    playlist_add(list, "track-1", "Bohemian Rhapsody", "Queen", MEDIA_TYPE_AUDIO, "media/audio/bohemian.mp3");
    playlist_add(list, "track-2", "Ocean Coastline Waves", "Earth Visuals", MEDIA_TYPE_VIDEO, "media/video/ocean.mp4");
    playlist_add(list, "track-3", "Hotel California", "Eagles", MEDIA_TYPE_AUDIO, "media/audio/hotel.mp3");
    playlist_add(list, "track-4", "Big Buck Bunny (Sample)", "Blender Studio", MEDIA_TYPE_VIDEO, "media/video/bunny.mp4");
    playlist_add(list, "track-5", "Blinding Lights", "The Weeknd", MEDIA_TYPE_AUDIO, "media/audio/blinding.mp3");
}

int main(void) {
    CircularPlaylist* playlist = playlist_create();
    if (!playlist) {
        fprintf(stderr, "Failed to allocate memory for playlist.\n");
        return 1;
    }

    /* Seed initial items for instant testing */
    seed_sample_data(playlist);

    int choice = -1;
    char buffer[256];

    while (1) {
        printf("\n======================================================================\n");
        printf("        LOOPIFY — CIRCULAR DOUBLY LINKED LIST MANAGER (C)             \n");
        printf("======================================================================\n");
        if (playlist->current) {
            printf("  NOW PLAYING: [%s] by %s (Type: %s) (Addr: %p)\n",
                   playlist->current->title,
                   playlist->current->artist,
                   playlist->current->type == MEDIA_TYPE_VIDEO ? "VIDEO" : "AUDIO",
                   (void*)playlist->current);
            printf("  POINTERS:    Prev: [%s] (%p) <===> Next: [%s] (%p)\n",
                   playlist->current->prev ? playlist->current->prev->title : "None",
                   (void*)(playlist->current->prev),
                   playlist->current->next ? playlist->current->next->title : "None",
                   (void*)(playlist->current->next));
        } else {
            printf("  PLAYLIST STATUS: [EMPTY]\n");
        }
        printf("----------------------------------------------------------------------\n");
        printf("  [1]  Add Media Item (Append to Tail, O(1))\n");
        printf("  [2]  Insert Media Item After ID (O(1) Splice)\n");
        printf("  [3]  Remove Media Item by ID (O(n) Search + O(1) Unlink)\n");
        printf("  [4]  Navigate Next Item (O(1) Continuous Wraparound)\n");
        printf("  [5]  Navigate Previous Item (O(1) Continuous Wraparound)\n");
        printf("  [6]  Select Media Item by ID (O(n))\n");
        printf("  [7]  Search Media by Title or Artist (O(n))\n");
        printf("  [8]  Display Complete Playlist & Pointer Memory Table\n");
        printf("  [9]  Validate Circular Invariants (Runtime Integrity Check)\n");
        printf("  [10] Clear Entire Playlist (Free All Nodes)\n");
        printf("  [11] Re-seed Demo Sample Media\n");
        printf("  [0]  Exit Application\n");
        printf("======================================================================\n");
        printf("Enter your choice [0-11]: ");

        if (fgets(buffer, sizeof(buffer), stdin) == NULL) {
            break;
        }

        if (sscanf(buffer, "%d", &choice) != 1) {
            printf("Invalid input. Please enter a valid number.\n");
            continue;
        }

        if (choice == 0) {
            printf("\nExiting and freeing all allocated dynamic memory...\n");
            break;
        }

        switch (choice) {
            case 1: {
                char id[64], title[128], artist[128], source[512], type_str[16];
                printf("\n--- 1. Add Media Item (Append O(1)) ---\n");
                read_string("Enter Unique ID (e.g. t101): ", id, sizeof(id));
                read_string("Enter Media Title: ", title, sizeof(title));
                read_string("Enter Artist / Creator: ", artist, sizeof(artist));
                read_string("Enter Media Type (audio/video): ", type_str, sizeof(type_str));
                read_string("Enter File Path or URL Source: ", source, sizeof(source));

                MediaType type = (strcmp(type_str, "video") == 0) ? MEDIA_TYPE_VIDEO : MEDIA_TYPE_AUDIO;
                if (playlist_add(playlist, id, title, artist, type, source)) {
                    printf("\n>>> Successfully added '%s' to tail in O(1) time!\n", title);
                } else {
                    printf("\n>>> Failed to add media item (Memory allocation error).\n");
                }
                break;
            }

            case 2: {
                char target_id[64], id[64], title[128], artist[128], source[512], type_str[16];
                printf("\n--- 2. Insert After Specific ID ---\n");
                read_string("Enter Target Item ID to insert after: ", target_id, sizeof(target_id));
                read_string("Enter New Item ID: ", id, sizeof(id));
                read_string("Enter New Item Title: ", title, sizeof(title));
                read_string("Enter New Item Artist: ", artist, sizeof(artist));
                read_string("Enter Media Type (audio/video): ", type_str, sizeof(type_str));
                read_string("Enter File Path or Source: ", source, sizeof(source));

                MediaType type = (strcmp(type_str, "video") == 0) ? MEDIA_TYPE_VIDEO : MEDIA_TYPE_AUDIO;
                if (playlist_insert_after(playlist, target_id, id, title, artist, type, source)) {
                    printf("\n>>> Successfully spliced '%s' after '%s'!\n", title, target_id);
                } else {
                    printf("\n>>> Insertion failed: Target ID '%s' not found.\n", target_id);
                }
                break;
            }

            case 3: {
                char id[64];
                printf("\n--- 3. Remove Item by ID ---\n");
                read_string("Enter Item ID to remove: ", id, sizeof(id));
                if (playlist_remove(playlist, id)) {
                    printf("\n>>> Successfully unlinked and freed item '%s'!\n", id);
                } else {
                    printf("\n>>> Remove failed: Item ID '%s' not found.\n", id);
                }
                break;
            }

            case 4: {
                MediaNode* node = playlist_next(playlist);
                if (node) {
                    printf("\n>>> [O(1) NEXT]: Now playing '%s' (%s)\n", node->title, node->artist);
                } else {
                    printf("\n>>> Playlist is empty.\n");
                }
                break;
            }

            case 5: {
                MediaNode* node = playlist_previous(playlist);
                if (node) {
                    printf("\n>>> [O(1) PREVIOUS]: Now playing '%s' (%s)\n", node->title, node->artist);
                } else {
                    printf("\n>>> Playlist is empty.\n");
                }
                break;
            }

            case 6: {
                char id[64];
                printf("\n--- 6. Select Item by ID ---\n");
                read_string("Enter Item ID to select: ", id, sizeof(id));
                MediaNode* node = playlist_select(playlist, id);
                if (node) {
                    printf("\n>>> Selected: '%s' (%s)\n", node->title, node->artist);
                } else {
                    printf("\n>>> Item '%s' not found.\n", id);
                }
                break;
            }

            case 7: {
                char query[128];
                printf("\n--- 7. Search Media (Non-Mutating) ---\n");
                read_string("Enter search keyword (title or artist): ", query, sizeof(query));

                MediaNode* results[20];
                int count = playlist_search(playlist, query, results, 20);
                printf("\nFound %d matching item(s):\n", count);
                for (int i = 0; i < count; i++) {
                    printf("  [%d] ID: %-10s | Title: %-24s | Artist: %s\n", 
                           i + 1, results[i]->id, results[i]->title, results[i]->artist);
                }
                break;
            }

            case 8: {
                playlist_display(playlist);
                break;
            }

            case 9: {
                printf("\n--- 9. Validating Circular Invariants ---\n");
                char err_buf[256];
                if (playlist_validate_integrity(playlist, err_buf, sizeof(err_buf))) {
                    printf("\n>>> ALL INVARIANTS INTACT (100%% Valid CDLL):\n");
                    printf("    - Head.prev identifies Tail\n");
                    printf("    - Tail.next identifies Head\n");
                    printf("    - Every node.next.prev == node\n");
                    printf("    - Every node.prev.next == node\n");
                    printf("    - Traversing %d nodes returns to Head\n", playlist->count);
                } else {
                    printf("\n>>> INVARIANT CORRUPTION DETECTED: %s\n", err_buf);
                }
                break;
            }

            case 10: {
                playlist_clear(playlist);
                printf("\n>>> Playlist cleared! All nodes freed from memory.\n");
                break;
            }

            case 11: {
                playlist_clear(playlist);
                seed_sample_data(playlist);
                printf("\n>>> Reset and seeded 5 demo tracks.\n");
                break;
            }

            default:
                printf("\n>>> Invalid choice. Please select from 0 to 11.\n");
                break;
        }
    }

    playlist_destroy(playlist);
    printf("Goodbye!\n");
    return 0;
}
