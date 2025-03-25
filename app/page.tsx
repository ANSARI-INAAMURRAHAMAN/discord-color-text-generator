'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { 
  Title, 
  Text, 
  Button, 
  Group, 
  Tooltip 
} from '@mantine/core';
import styles from './page.module.css';

// ANSI Color Codes
const ANSI_COLORS = {
  styles: [
    { code: 0, name: 'Reset', className: '' },
    { code: 1, name: 'Bold', className: 'ansi-1' },
    { code: 4, name: 'Underline', className: 'ansi-4' }
  ],
  fg: [
    { code: 30, name: 'Dark Gray (33%)', color: '#4f545c', className: 'ansi-30' },
    { code: 31, name: 'Red', color: '#dc322f', className: 'ansi-31' },
    { code: 32, name: 'Yellowish Green', color: '#859900', className: 'ansi-32' },
    { code: 33, name: 'Gold', color: '#b58900', className: 'ansi-33' },
    { code: 34, name: 'Light Blue', color: '#268bd2', className: 'ansi-34' },
    { code: 35, name: 'Pink', color: '#d33682', className: 'ansi-35' },
    { code: 36, name: 'Teal', color: '#2aa198', className: 'ansi-36' },
    { code: 37, name: 'White', color: '#ffffff', className: 'ansi-37' }
  ],
  bg: [
    { code: 40, name: 'Blueish Black', color: '#002b36', className: 'ansi-40' },
    { code: 41, name: 'Rust Brown', color: '#cb4b16', className: 'ansi-41' },
    { code: 42, name: 'Gray (40%)', color: '#586e75', className: 'ansi-42' },
    { code: 43, name: 'Gray (45%)', color: '#657b83', className: 'ansi-43' },
    { code: 44, name: 'Light Gray (55%)', color: '#839496', className: 'ansi-44' },
    { code: 45, name: 'Blurple', color: '#6c71c4', className: 'ansi-45' },
    { code: 46, name: 'Light Gray (60%)', color: '#93a1a1', className: 'ansi-46' },
    { code: 47, name: 'Cream White', color: '#fdf6e3', className: 'ansi-47' }
  ]
};

export default function DiscordColorGenerator() {
  const [content, setContent] = useState<string>('Welcome to Inaam Discord Colored Text Generator!');
  const [copyCount, setCopyCount] = useState(0);
  const textareaRef = useRef<HTMLDivElement>(null);
  
  const applyStyle = (className: string) => {
    if (!textareaRef.current) return;
    
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    
    const range = selection.getRangeAt(0);
    
    // Check if the selection is within our textarea
    let container = range.commonAncestorContainer;
    while (container && container !== textareaRef.current) {
      container = container.parentNode as Node;
    }
    
    if (!container) {
      // Selection is not within our textarea
      console.log("Please select text within the editor");
      return;
    }
    
    const selectedText = selection.toString();
    if (!selectedText || selectedText.trim() === '') return;
    
    // Create a new span with the class
    const span = document.createElement('span');
    if (className) {
      span.className = className;
      
      // Apply visual style directly to help with rendering
      const codeMatch = className.match(/ansi-(\d+)/);
      if (codeMatch) {
        const code = parseInt(codeMatch[1]);
        
        // Apply styles based on code ranges
        if (code === 1) {
          span.style.fontWeight = 'bold';
        } else if (code === 4) {
          span.style.textDecoration = 'underline';
        } else if (code >= 30 && code <= 37) {
          // Foreground colors
          const fgColor = ANSI_COLORS.fg.find(c => c.code === code);
          if (fgColor) span.style.color = fgColor.color;
        } else if (code >= 40 && code <= 47) {
          // Background colors
          const bgColor = ANSI_COLORS.bg.find(c => c.code === code);
          if (bgColor) span.style.backgroundColor = bgColor.color;
          
          // Add white text on dark backgrounds for better visibility
          if (code === 40 || code === 41 || code === 44 || code === 45) {
            span.style.color = '#ffffff';
          }
          
          // Add black text on light backgrounds
          if (code === 47) {
            span.style.color = '#000000';
          }
        }
      }
    }
    span.textContent = selectedText;
    
    // Replace the selected text with our styled span
    range.deleteContents();
    range.insertNode(span);
    
    // Restore selection and place cursor at the end of the styled text
    selection.removeAllRanges();
    const newRange = document.createRange();
    newRange.selectNodeContents(span);
    newRange.collapse(false); // Collapse to end
    selection.addRange(newRange);
    
    // Force a rerender by updating the content state
    if (textareaRef.current) {
      setContent(textareaRef.current.innerHTML);
    }
    
    // Update preview
    updatePreview();
  };

  const convertToANSI = (node: Node): string => {
    // Remove the unused result variable
    
    // Helper function to traverse DOM and generate ANSI codes
    const traverseNodes = (currentNode: Node): string => {
      let text = '';
      
      if (currentNode.nodeType === Node.TEXT_NODE) {
        return currentNode.textContent || '';
      }
      
      if (currentNode.nodeType === Node.ELEMENT_NODE) {
        const element = currentNode as HTMLElement;
        const stylesCodes: number[] = [];
        
        // Extract ANSI codes from class names
        Array.from(element.classList).forEach(cls => {
          const match = cls.match(/ansi-(\d+)/);
          if (match && match[1]) {
            stylesCodes.push(parseInt(match[1]));
          }
        });
        
        // Sort codes by category for proper ANSI escape sequence
        // Format: ESC[style;fg;bgm
        const styles = stylesCodes.filter(code => code < 10).sort();
        const fg = stylesCodes.filter(code => code >= 30 && code < 40).sort();
        const bg = stylesCodes.filter(code => code >= 40 && code < 50).sort();
        
        const codes = [...styles, ...fg, ...bg];
        
        // Apply ANSI codes if we have any
        if (codes.length > 0) {
          text += `\u001b[${codes.join(';')}m`;
        }
        
        // Process child nodes
        for (let i = 0; i < currentNode.childNodes.length; i++) {
          text += traverseNodes(currentNode.childNodes[i]);
        }
        
        // Reset styling after this element
        if (codes.length > 0) {
          text += '\u001b[0m';
        }
      }
      
      return text;
    };
    
    // Start traversal with the main container node
    return traverseNodes(node);
  };

  const handleCopy = () => {
    if (!textareaRef.current) return;
    
    // Get the content and convert to ANSI
    const ansiText = convertToANSI(textareaRef.current);
    const formattedText = "```ansi\n" + ansiText + "\n```";
    
    navigator.clipboard.writeText(formattedText).then(() => {
      // Just increment copyCount for visual feedback but don't change the message
      setCopyCount(1);
      
      // Reset the "Copied" message after 2 seconds
      setTimeout(() => {
        setCopyCount(0);
      }, 2000);
    });
  };

  const handleContentInput = (e: React.FormEvent<HTMLDivElement>) => {
    // Sanitize input to prevent script injection but preserve our spans with classes
    const target = e.target as HTMLDivElement;
    
    // Temporarily store current cursor position
    const selection = window.getSelection();
    const range = selection?.getRangeAt(0);
    
    // Get the current HTML content
    const currentHTML = target.innerHTML;
    
    // Sanitize HTML - preserve spans with ansi classes but remove other potentially harmful tags
    const sanitized = currentHTML
      .replace(/<(\/?(br|div|p|span)(?: class="ansi-\d+")?)>/g, "[$1]") // Preserve formatting tags
      .replace(/<[^>]+>/g, "") // Remove any other HTML
      .replace(/\[(\/?(br|div|p|span)(?: class="ansi-\d+")?)\]/g, "<$1>"); // Restore formatting
      
    // Only update if content changed to avoid cursor jumping
    if (currentHTML !== sanitized) {
      target.innerHTML = sanitized;
      
      // Try to restore cursor position
      if (selection && range && selection.rangeCount > 0) {
        try {
          selection.removeAllRanges();
          selection.addRange(range);
        } catch (e) {
          console.log("Could not restore selection", e);
        }
      }
      
      // Update content state
      setContent(sanitized);
      
      // Update the preview after changes
      setTimeout(updatePreview, 0);
    }
  };

  // Add a click handler to ensure textarea is focused when clicking anywhere in it
  const handleTextareaClick = () => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const updatePreview = useCallback(() => {
    // We're not using preview anymore, so we can simplify this function
    // No need to update previewAnsi state
  }, []);
  
  // Update preview when content changes
  useEffect(() => {
    updatePreview();
  }, [content, updatePreview]);

  return (
    <div className={styles.container}>
      <Title order={1} mb="xl">
        Discord <span style={{color: '#5865F2'}}>Colored</span> Text Generator
      </Title>

      {/* Style Buttons */}
      <Group justify="center" mb="md">
        {ANSI_COLORS.styles.map((style) => (
          <Button 
            key={style.code}
            onClick={() => applyStyle(style.className)}
            className={styles.styledButton}
          >
            {style.name}
          </Button>
        ))}
      </Group>

      {/* Color Selection */}
      <Group justify="center" mb="md">
        <Text>FG Colors:</Text>
        {ANSI_COLORS.fg.map((color) => (
          <Tooltip key={color.code} label={color.name}>
            <Button
              onClick={() => applyStyle(color.className)}
              className={`${styles.colorButton} ${color.className}`}
              style={{ backgroundColor: color.color }}
            />
          </Tooltip>
        ))}
      </Group>

      <Group justify="center" mb="md">
        <Text>BG Colors:</Text>
        {ANSI_COLORS.bg.map((color) => (
          <Tooltip key={color.code} label={color.name}>
            <Button
              onClick={() => applyStyle(color.className)}
              className={`${styles.colorButton} ${color.className}`}
              style={{ backgroundColor: color.color }}
            />
          </Tooltip>
        ))}
      </Group>

      {/* Editable Textarea */}
      <div 
        ref={textareaRef}
        contentEditable 
        className={styles.textarea}
        onInput={handleContentInput}
        onClick={handleTextareaClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            document.execCommand('insertLineBreak');
          }
        }}
        dangerouslySetInnerHTML={{ __html: content }}
      />

      <Group justify="center" mt="md">
        <Button 
          onClick={handleCopy}
          className={styles.copyButton}
          style={{
            backgroundColor: '#3BA55D'
          }}
        >
          {copyCount === 0 
            ? "Copy text as Discord formatted" 
            : "Copied!"
          }
        </Button>
      </Group>

      <Text mt="lg" size="xs" color="dimmed">
        This is an unofficial tool, it is not made or endorsed by Discord.
      </Text>
    </div>
  );
}