import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, ViewChild, inject } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { catchError, finalize, of } from 'rxjs';

interface PageImage { src: string; alt?: string; }
interface EditableItem { title?: string; description: string; }
interface EditableSection {
  headingFirst: string;
  headingSecond: string;
  subtitle?: string;
  paragraphs: string[];
  items: EditableItem[];
  images: PageImage[];
  quote?: string;
  enabled?: boolean;
}
interface BrandingTextBlock {
  headingFirst: string;
  headingSecond: string;
  subtitle: string;
  description: string;
}
interface BrandingTheme extends BrandingTextBlock {
  type: 'primary' | 'secondary' | 'tertiary';
  colors: BrandingColor[];
}
interface BrandingColor { hex: string; name: string; }
interface BrandingContent {
  overviewSection: BrandingTextBlock;
  typography: BrandingTextBlock & {
    primaryFontHeading: string;
    primaryFontDescription: string;
    secondaryFontHeading: string;
    secondaryFontDescription: string;
  };
  colorPalette: BrandingTextBlock & { themes: BrandingTheme[] };
  logoDesignSection: BrandingTextBlock & { images: PageImage[] };
  /* Legacy keys retained so previously saved branding data can still be read. */
  overview?: string;
  colors?: BrandingColor[];
  theme?: string;
  logoDesign?: string;
}
interface PageContent {
  overview: { clientLogo: string; client: string; duration: string; geoScope: string; domain: string; productScale: string; };
  context: EditableSection;
  challenge: EditableSection;
  approach: EditableSection;
  transformation: EditableSection;
  impact: EditableSection;
  certifications: EditableSection;
  relatedProjectIds: string[];
  branding: BrandingContent;
}
interface EditableProject {
  id: string; _id?: string; title: string; description: string; year: number;
  serialNo?: number; coverImage: string; slug: string; status?: 'draft' | 'published';
}

@Component({
  selector: 'app-edit-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './edit-page.html',
  styleUrl: './edit-page.css'
})
export class EditPageComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly http = inject(HttpClient);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly apiUrl = 'https://company-portfolio-api.onrender.com/projects';
  private readonly cdr = inject(ChangeDetectorRef);

  @ViewChild('slider') slider?: ElementRef<HTMLElement>;

  project: EditableProject | null = null;
  loading = true;
  error = '';
  saveError = '';
  saveSuccess = '';
  editingSection: string | null = null;
  savingSection: string | null = null;
  showAssociateProjects = false;
  availableProjects: EditableProject[] = [];
  selectedRelatedProjectIds: string[] = [];
  projectSearch = '';
  sectionErrors: Record<string, string> = {};
  activeTab = 'Overview';
  tabList = ['Overview', 'Branding'];

  page: PageContent = this.createDefaultPage();
  draft: PageContent = this.createDefaultPage();
  activeIndex = 0;
  isDragging = false;
  private pointerStartX: number | null = null;
  private pointerStartScroll = 0;
  private autoplayTimer?: ReturnType<typeof setInterval>;

  get filteredProjects(): EditableProject[] {
    const search = this.projectSearch.trim().toLowerCase();
    return this.availableProjects.filter(p => !search || p.title.toLowerCase().includes(search));
  }

  get relatedProjectCards(): EditableProject[] {
    const ids = this.page.relatedProjectIds;
    return ids.map(id => this.availableProjects.find(p => p.id === id) ?? null)
      .filter((p): p is EditableProject => !!p);
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.error = 'Project ID is missing from the route.';
      this.loading = false;
      return;
    }
    this.http.get<any>(`${this.apiUrl}/${encodeURIComponent(id)}`).pipe(
      catchError(err => {
        this.error = err?.error?.message || 'Unable to load the selected project.';
        this.loading = false;
        return of(null);
      })
    ).subscribe(project => {
      if (!project) return;
      this.project = { ...project, id: String(project.id ?? project._id ?? id) } as EditableProject;
      this.loadAvailableProjects();
      this.loadPageContent(this.project.id);
    });
  }

/** The editor renders saved data only. Guidance belongs in input placeholders, never in the saved model. */
get displayPage(): PageContent {
  return this.page;
}

private createDefaultPage(): PageContent {
  const emptySection = (): EditableSection => ({
    headingFirst: '',
    headingSecond: '',
    subtitle: '',
    paragraphs: [],
    items: [],
    images: [],
    quote: ''
  });

  return {
    overview: {
      clientLogo: '',
      client: '',
      duration: '',
      geoScope: '',
      domain: '',
      productScale: ''
    },

    context: emptySection(),
    challenge: emptySection(),
    approach: emptySection(),
    transformation: emptySection(),
    impact: emptySection(),
    certifications: emptySection(),

    relatedProjectIds: [],

    branding: {
      overviewSection: { headingFirst: '', headingSecond: '', subtitle: '', description: '' },
      typography: {
        headingFirst: '', headingSecond: '', subtitle: '', description: '',
        primaryFontHeading: '', primaryFontDescription: '',
        secondaryFontHeading: '', secondaryFontDescription: ''
      },
      colorPalette: { headingFirst: '', headingSecond: '', subtitle: '', description: '', themes: [] },
      logoDesignSection: { headingFirst: '', headingSecond: '', subtitle: '', description: '', images: [] },
      overview: '', colors: [], theme: '', logoDesign: ''
    }
  };
}


  private loadPageContent(projectId: string): void {
    this.http
      .get<Partial<PageContent>>(
        `${this.apiUrl}/${encodeURIComponent(projectId)}/detail-page`
      )
      .pipe(
        catchError(err => {
          console.error(
            'Edit Page content request failed:',
            err.status,
            err.error
          );

          this.error =
            err?.status === 404
              ? 'The detail-page API is unavailable. Check the deployed backend route.'
              : err?.error?.message ||
              'Unable to load saved page content.';

          return of(null);
        }),
        finalize(() => {
          this.loading = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe(saved => {
        this.page = this.mergePage(
          this.createDefaultPage(),
          saved ?? {}
        );

        this.draft = this.clone(this.page);
      });
  }


  private loadAvailableProjects(): void {
    this.http.get<any[]>(this.apiUrl).pipe(catchError(() => of([]))).subscribe(items => {
      this.availableProjects = (items ?? [])
        .map(item => ({ ...item, id: String(item.id ?? item._id ?? '') }) as EditableProject)
        .filter(p => p.id && p.id !== this.project?.id);
    });
  }

  private mergePage(base: PageContent, saved: Partial<PageContent>): PageContent {
    const mergeSection = (original: EditableSection, update?: Partial<EditableSection>): EditableSection => ({
      ...original, ...(update ?? {}),
      paragraphs: update?.paragraphs ?? original.paragraphs,
      items: update?.items ?? original.items,
      images: update?.images ?? original.images
    });
    return {
      ...base, ...saved,
      overview: { ...base.overview, ...(saved.overview ?? {}) },
      context: mergeSection(base.context, saved.context),
      challenge: mergeSection(base.challenge, saved.challenge),
      approach: mergeSection(base.approach, saved.approach),
      transformation: mergeSection(base.transformation, saved.transformation),
      impact: mergeSection(base.impact, saved.impact),
      certifications: mergeSection(base.certifications, saved.certifications),
      relatedProjectIds: saved.relatedProjectIds ?? base.relatedProjectIds,
      branding: {
        ...base.branding, ...(saved.branding ?? {}),
        overviewSection: { ...base.branding.overviewSection, ...((saved.branding as any)?.overviewSection ?? {}) },
        typography: { ...base.branding.typography, ...((saved.branding as any)?.typography && typeof (saved.branding as any).typography === 'object' ? (saved.branding as any).typography : {}) },
        colorPalette: { ...base.branding.colorPalette, ...((saved.branding as any)?.colorPalette ?? {}), themes: (saved.branding as any)?.colorPalette?.themes ?? [] },
        logoDesignSection: { ...base.branding.logoDesignSection, ...((saved.branding as any)?.logoDesignSection ?? {}), images: (saved.branding as any)?.logoDesignSection?.images ?? [] },
        colors: (saved.branding as any)?.colors ?? base.branding.colors
      }
    };
  }

  selectTab(tab: string): void { this.activeTab = tab; }

  startEdit(section: string): void {
    this.saveError = ''; this.saveSuccess = ''; this.sectionErrors = {};
    this.draft = this.clone(this.page);
    if (['context', 'challenge', 'approach', 'transformation', 'impact'].includes(section)) {
      const target = (this.draft as any)[section] as EditableSection;
      if (!target.paragraphs.length) target.paragraphs = [''];
    }
    this.editingSection = section;
  }

  cancelEdit(): void {
    this.draft = this.clone(this.page);
    this.editingSection = null;
    this.saveError = ''; this.sectionErrors = {};
  }

  saveSection(section: string): void {
    const id = this.project?.id;
    if (!id) { this.saveError = 'Project ID is missing. Changes were not saved.'; return; }
    if (this.savingSection) return;
    if (['context', 'challenge', 'approach', 'transformation', 'impact', 'certifications'].includes(section)) {
      const content = (this.draft as any)[section] as EditableSection;
      content.paragraphs = (content.paragraphs ?? []).filter((value: string) => !!value?.replace(/<[^>]*>/g, '').trim());
      const hasContent = !!(content.headingFirst?.trim() || content.headingSecond?.trim() || content.subtitle?.trim() || content.quote?.trim() ||
        content.paragraphs.length || content.items.some(item => !!(item.title?.trim() || item.description?.trim())) || content.images.some(image => !!image.src?.trim()));
      // Preserve an explicit restore action even when the section is currently empty.
      // Only infer visibility from content when the section has no saved enabled flag.
      if (content.enabled === undefined) {
        content.enabled = hasContent;
      }
    }
    const payload = section === 'related'
      ? { relatedProjectIds: [...this.selectedRelatedProjectIds] }
      : { [section]: this.clone((this.draft as any)[section]) };
    this.savingSection = section;
    this.saveError = ''; this.saveSuccess = ''; this.sectionErrors[section] = '';
    this.http.patch<any>(`${this.apiUrl}/${encodeURIComponent(id)}/detail-page/${encodeURIComponent(section)}`, payload)
      .pipe(
  finalize(() => {
    this.savingSection = null;
    this.cdr.detectChanges();
  })
)
      .subscribe({
        next: response => {
          if (section === 'related') this.page.relatedProjectIds = [...this.selectedRelatedProjectIds];
          else (this.page as any)[section] = this.clone((this.draft as any)[section]);
          if (response?.[section] && section !== 'related') (this.page as any)[section] = { ...(this.page as any)[section], ...response[section] };
          this.draft = this.clone(this.page);
          this.editingSection = null;
          this.saveSuccess = 'Changes saved successfully.';
          this.sectionErrors[section] = '';
          if (section === 'related') this.showAssociateProjects = false;
        },
        error: err => {
          const message = err?.error?.message || `Could not save ${section}. Your changes are still in the editor. Please try again.`;
          this.saveError = message;
          this.sectionErrors[section] = message;
        }
      });
  }

  selectImage(event: Event, section: 'overview', field: 'clientLogo'): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { this.saveError = 'Please select an image file.'; input.value = ''; return; }
    this.readImage(file).then(src => this.draft[section][field] = src)
      .catch(() => this.saveError = 'Unable to read the selected image.')
      .finally(() => input.value = '');
  }

  selectMultipleImages(event: Event, section: 'context' | 'certifications', field: 'images'): void {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []).filter(file => file.type.startsWith('image/'));
    const remaining = section === 'certifications' ? Math.max(0, 2 - this.draft.certifications.images.length) : files.length;
    const chosen = files.slice(0, remaining);
    Promise.all(chosen.map(file => this.readImage(file))).then(sources => {
      this.draft[section][field].push(...sources.map((src, i) => ({ src, alt: chosen[i]?.name ?? '' })));
      if (section === 'certifications') this.draft.certifications.images = this.draft.certifications.images.slice(0, 2);
    }).catch(() => this.saveError = 'Unable to read one or more selected images.')
      .finally(() => input.value = '');
  }

  private readImage(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => typeof reader.result === 'string' ? resolve(reader.result) : reject(new Error('Could not read image.'));
      reader.onerror = () => reject(reader.error ?? new Error('Could not read image.'));
      reader.readAsDataURL(file);
    });
  }

  addItem(section: 'approach' | 'transformation' | 'impact', field: 'items'): void {
    this.draft[section][field].push({ title: section === 'transformation' ? undefined : '', description: '' });
  }

  removeItem(section: 'context' | 'approach' | 'transformation' | 'impact' | 'certifications', field: 'items' | 'images', index: number): void {
    (this.draft[section] as any)[field].splice(index, 1);
  }

  moveItem(section: 'context' | 'approach' | 'transformation' | 'impact', field: 'items' | 'images', index: number, direction: -1 | 1): void {
    const list = (this.draft[section] as any)[field] as unknown[];
    const target = index + direction;
    if (target < 0 || target >= list.length) return;
    [list[index], list[target]] = [list[target], list[index]];
  }

  private richTextTarget: HTMLElement | null = null;
  setRichTextTarget(event: FocusEvent): void { this.richTextTarget = event.target as HTMLElement; }

  updateRichText(event: Event, section: 'context' | 'challenge' | 'approach' | 'transformation' | 'impact', paragraphIndex: number): void {
    this.draft[section].paragraphs[paragraphIndex] = (event.target as HTMLElement).innerHTML;
  }

  formatRichText(section: 'context' | 'challenge' | 'approach' | 'transformation' | 'impact', paragraphIndex: number, format: 'bold' | 'italic' | 'underline'): void {
    const editor = this.richTextTarget;
    if (!editor) return;
    editor.focus();
    document.execCommand(format, false);
    this.draft[section].paragraphs[paragraphIndex] = editor.innerHTML;
  }

  openAssociateProjects(): void {
    this.selectedRelatedProjectIds = [...this.page.relatedProjectIds];
    this.showAssociateProjects = true;
    this.saveError = '';
  }


  closeAssociateProjects(): void {
    this.selectedRelatedProjectIds = [
      ...this.page.relatedProjectIds
    ];

    this.showAssociateProjects = false;
    this.saveError = '';
  }

  isAssociated(id: string): boolean { return this.selectedRelatedProjectIds.includes(id); }


  toggleAssociated(id: string, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;

    if (checked) {
      if (!this.selectedRelatedProjectIds.includes(id)) {
        this.selectedRelatedProjectIds = [
          ...this.selectedRelatedProjectIds,
          id
        ];
      }
    } else {
      this.selectedRelatedProjectIds =
        this.selectedRelatedProjectIds.filter(
          projectId => projectId !== id
        );
    }

    this.saveError = '';
    this.saveSuccess = '';
  }


  get hasRelatedProjectChanges(): boolean {
    const saved = this.page.relatedProjectIds;
    const selected = this.selectedRelatedProjectIds;

    return (
      saved.length !== selected.length ||
      saved.some(id => !selected.includes(id))
    );
  }




saveRelatedProjects(): void {
  this.saveSection('related');
}

  removeSection(section: 'context' | 'challenge' | 'approach' | 'transformation' | 'impact' | 'certifications'): void {
    this.draft = this.clone(this.page);
    (this.draft[section] as EditableSection).enabled = false;
    this.editingSection = section;
    this.saveSection(section);
  }

  restoreSection(section: 'context' | 'challenge' | 'approach' | 'transformation' | 'impact' | 'certifications'): void {
    this.draft = this.clone(this.page);
    (this.draft[section] as EditableSection).enabled = true;
    // Save immediately so the section returns to the public page and remains restored after reload.
    this.saveSection(section);
  }

  addBrandTheme(type: 'primary' | 'secondary' | 'tertiary'): void {
    this.draft.branding.colorPalette.themes.push({
      type, headingFirst: '', headingSecond: '', subtitle: '', description: '', colors: []
    });
  }

  addBrandThemeColor(theme: BrandingTheme): void {
    theme.colors.push({ hex: '#000000', name: '' });
  }

  selectBrandLogoImages(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []).filter(file => file.type.startsWith('image/'));
    Promise.all(files.map(file => this.readImage(file))).then(sources => {
      this.draft.branding.logoDesignSection.images.push(...sources.map((src, i) => ({ src, alt: files[i]?.name ?? 'Logo design' })));
    }).catch(() => this.saveError = 'Unable to read one or more selected images.')
      .finally(() => input.value = '');
  }

  openPreview(): void {
    if (!this.project) return;
    const routeValue = this.project.slug || this.project.id;
    void this.router.navigate(['/projects', routeValue]);
  }

  goBack(): void { void this.router.navigate(['/admin/projects']); }

  safeHtml(value: string | null | undefined): SafeHtml {
    const cleaned = this.sanitizer.sanitize(1, value ?? '') ?? '';
    return this.sanitizer.bypassSecurityTrustHtml(cleaned);
  }

  onPointerDown(event: PointerEvent): void {
    if (!this.slider) return;
    this.pointerStartX = event.clientX;
    this.pointerStartScroll = this.slider.nativeElement.scrollLeft;
    this.isDragging = true;
    (event.currentTarget as HTMLElement).setPointerCapture?.(event.pointerId);
  }
  onPointerMove(event: PointerEvent): void {
    if (this.pointerStartX === null || !this.slider) return;
    this.slider.nativeElement.scrollLeft = this.pointerStartScroll - (event.clientX - this.pointerStartX);
  }
  onPointerUp(_event: PointerEvent): void { this.pointerStartX = null; this.isDragging = false; }
  onSlideItemClick(index: number, _event: MouseEvent): void { this.activeIndex = index; }
  nextSlide(): void {
    if (!this.slider) return;
    const items = this.slider.nativeElement.querySelectorAll<HTMLElement>('.item');
    if (!items.length) return;
    this.activeIndex = (this.activeIndex + 1) % items.length;
    items[this.activeIndex].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }
  previousSlide(): void {
    if (!this.slider) return;
    const items = this.slider.nativeElement.querySelectorAll<HTMLElement>('.item');
    if (!items.length) return;
    this.activeIndex = (this.activeIndex - 1 + items.length) % items.length;
    items[this.activeIndex].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }

  private clone<T>(value: T): T { return JSON.parse(JSON.stringify(value)) as T; }
  ngOnDestroy(): void { if (this.autoplayTimer) clearInterval(this.autoplayTimer); }
}
